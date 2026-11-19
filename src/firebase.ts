import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Pure-TS FIPS 180-4 SHA-256 implementation (works identically in all browsers, mobile webviews, and Node)
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256HexSync(asciiOrUtf8: string): string {
  const bytes = new TextEncoder().encode(asciiOrUtf8);
  const bitLen = bytes.length * 8;
  const totalLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((n) => n.toString(16).padStart(8, '0'))
    .join('');
}

export function normalizeAcademyPasscode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function hashAcademyPasscode(raw: string): string {
  return sha256HexSync(normalizeAcademyPasscode(raw));
}

export const PRIMARY_OWNER_ADMIN_EMAIL = 'PsWilliamh@gmail.com';
export const DEFAULT_INTERMEDIATE_PASSCODE = 'SYMPHONY-2026';
export const DEFAULT_ADVANCED_PASSCODE = 'MASTERY-2026';
export const DEFAULT_ORIENTATION_VIDEO_URL = '/assets/The_Rhythm_of_the_Crowd.mp4';
export const DEFAULT_ORIENTATION_VIDEO_TITLE =
  'Fibonacci Part 1: The Rhythm of the Crowd (5:36)';

export const DEFAULT_INTERMEDIATE_PASSCODE_HASH = hashAcademyPasscode(
  DEFAULT_INTERMEDIATE_PASSCODE
);
export const DEFAULT_ADVANCED_PASSCODE_HASH = hashAcademyPasscode(DEFAULT_ADVANCED_PASSCODE);

export function isBootstrapOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_OWNER_ADMIN_EMAIL.toLowerCase();
}

export interface AcademyPublicGatesState {
  intermediatePasscodeHash: string;
  advancedPasscodeHash: string;
  intermediateGateEnabled: boolean;
  advancedGateEnabled: boolean;
  orientationVideoUrl: string;
  orientationVideoTitle: string;
}

export interface AcademyAdminSettingsState {
  secondaryAdminEmail: string;
  intermediatePasscodeLabel: string;
  advancedPasscodeLabel: string;
}

export const DEFAULT_PUBLIC_GATES_STATE: AcademyPublicGatesState = {
  intermediatePasscodeHash: DEFAULT_INTERMEDIATE_PASSCODE_HASH,
  advancedPasscodeHash: DEFAULT_ADVANCED_PASSCODE_HASH,
  intermediateGateEnabled: true,
  advancedGateEnabled: true,
  orientationVideoUrl: DEFAULT_ORIENTATION_VIDEO_URL,
  orientationVideoTitle: DEFAULT_ORIENTATION_VIDEO_TITLE,
};

export const DEFAULT_ADMIN_SETTINGS_STATE: AcademyAdminSettingsState = {
  secondaryAdminEmail: '',
  intermediatePasscodeLabel: DEFAULT_INTERMEDIATE_PASSCODE,
  advancedPasscodeLabel: DEFAULT_ADVANCED_PASSCODE,
};

// Blueprint-synchronized sanitization helpers (matching firebase-blueprint.json & firestore.rules)
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function sanitizeFirestoreId(raw: string, fallback = 'wallet_user', maxLen = 128): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, maxLen);
  if (!cleaned || !SAFE_ID_REGEX.test(cleaned)) {
    return fallback;
  }
  return cleaned;
}

export async function fetchAcademyPublicGatesFromFirestore(): Promise<AcademyPublicGatesState> {
  const path = 'academyConfig/publicGates';
  const ref = doc(db, 'academyConfig', 'publicGates');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_PUBLIC_GATES_STATE;
    }
    const d = snap.data();
    return {
      intermediatePasscodeHash:
        typeof d.intermediatePasscodeHash === 'string' && d.intermediatePasscodeHash.length === 64
          ? d.intermediatePasscodeHash
          : DEFAULT_INTERMEDIATE_PASSCODE_HASH,
      advancedPasscodeHash:
        typeof d.advancedPasscodeHash === 'string' && d.advancedPasscodeHash.length === 64
          ? d.advancedPasscodeHash
          : DEFAULT_ADVANCED_PASSCODE_HASH,
      intermediateGateEnabled:
        typeof d.intermediateGateEnabled === 'boolean' ? d.intermediateGateEnabled : true,
      advancedGateEnabled:
        typeof d.advancedGateEnabled === 'boolean' ? d.advancedGateEnabled : true,
      orientationVideoUrl:
        typeof d.orientationVideoUrl === 'string' && d.orientationVideoUrl.trim().length > 0
          ? d.orientationVideoUrl
          : DEFAULT_ORIENTATION_VIDEO_URL,
      orientationVideoTitle:
        typeof d.orientationVideoTitle === 'string' && d.orientationVideoTitle.length >= 3
          ? d.orientationVideoTitle
          : DEFAULT_ORIENTATION_VIDEO_TITLE,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchAcademyAdminSettingsFromFirestore(): Promise<AcademyAdminSettingsState> {
  const path = 'academyAdmin/settings';
  const ref = doc(db, 'academyAdmin', 'settings');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_ADMIN_SETTINGS_STATE;
    }
    const d = snap.data();
    return {
      secondaryAdminEmail:
        typeof d.secondaryAdminEmail === 'string' ? d.secondaryAdminEmail : '',
      intermediatePasscodeLabel:
        typeof d.intermediatePasscodeLabel === 'string' && d.intermediatePasscodeLabel.length >= 3
          ? d.intermediatePasscodeLabel
          : DEFAULT_INTERMEDIATE_PASSCODE,
      advancedPasscodeLabel:
        typeof d.advancedPasscodeLabel === 'string' && d.advancedPasscodeLabel.length >= 3
          ? d.advancedPasscodeLabel
          : DEFAULT_ADVANCED_PASSCODE,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface SaveAcademyConfigurationInput {
  user: User;
  intermediatePasscodePlain: string;
  advancedPasscodePlain: string;
  intermediateGateEnabled: boolean;
  advancedGateEnabled: boolean;
  orientationVideoUrl: string;
  orientationVideoTitle: string;
  secondaryAdminEmail: string;
}

export async function saveAcademyConfigurationToFirestore(
  input: SaveAcademyConfigurationInput
): Promise<{
  publicGates: AcademyPublicGatesState;
  adminSettings: AcademyAdminSettingsState;
}> {
  const { user } = input;
  if (!user.emailVerified) {
    throw new Error('Verified Google account required to save Academy Admin settings.');
  }

  const cleanIntCode = normalizeAcademyPasscode(
    input.intermediatePasscodePlain || DEFAULT_INTERMEDIATE_PASSCODE
  ).slice(0, 64);
  const cleanAdvCode = normalizeAcademyPasscode(
    input.advancedPasscodePlain || DEFAULT_ADVANCED_PASSCODE
  ).slice(0, 64);
  const safeIntCode = cleanIntCode.length >= 3 ? cleanIntCode : DEFAULT_INTERMEDIATE_PASSCODE;
  const safeAdvCode = cleanAdvCode.length >= 3 ? cleanAdvCode : DEFAULT_ADVANCED_PASSCODE;

  const intHash = hashAcademyPasscode(safeIntCode);
  const advHash = hashAcademyPasscode(safeAdvCode);

  const rawVideoUrl = input.orientationVideoUrl.trim().slice(0, 512);
  const safeVideoUrl =
    rawVideoUrl === '' || /^(https:\/\/|\/assets\/|\/api\/drive-video\/).+$/.test(rawVideoUrl)
      ? rawVideoUrl
      : '';
  const rawTitle = input.orientationVideoTitle.trim().slice(0, 160);
  const safeTitle = rawTitle.length >= 3 ? rawTitle : DEFAULT_ORIENTATION_VIDEO_TITLE;

  const rawSecEmail = input.secondaryAdminEmail.trim().slice(0, 160);
  const safeSecEmail =
    rawSecEmail === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawSecEmail) ? rawSecEmail : '';
  const safeUid = sanitizeFirestoreId(user.uid, 'admin_uid', 128);

  // 1. Save Admin-isolated settings (/academyAdmin/settings) first so secondaryAdminEmail is immediately active
  const adminPath = 'academyAdmin/settings';
  const adminRef = doc(db, 'academyAdmin', 'settings');
  let adminExists = false;
  try {
    const snap = await getDoc(adminRef);
    adminExists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, adminPath);
  }

  if (!adminExists) {
    try {
      await setDoc(adminRef, {
        secondaryAdminEmail: safeSecEmail,
        intermediatePasscodeLabel: safeIntCode,
        advancedPasscodeLabel: safeAdvCode,
        updatedByUid: safeUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, adminPath);
    }
  } else {
    try {
      await updateDoc(adminRef, {
        secondaryAdminEmail: safeSecEmail,
        intermediatePasscodeLabel: safeIntCode,
        advancedPasscodeLabel: safeAdvCode,
        updatedByUid: safeUid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, adminPath);
    }
  }

  // 2. Save Public SHA-256 Gate Hashes & Orientation Video Metadata (/academyConfig/publicGates)
  const publicPath = 'academyConfig/publicGates';
  const publicRef = doc(db, 'academyConfig', 'publicGates');
  let publicExists = false;
  try {
    const snap = await getDoc(publicRef);
    publicExists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, publicPath);
  }

  if (!publicExists) {
    try {
      await setDoc(publicRef, {
        intermediatePasscodeHash: intHash,
        advancedPasscodeHash: advHash,
        intermediateGateEnabled: input.intermediateGateEnabled,
        advancedGateEnabled: input.advancedGateEnabled,
        orientationVideoUrl: safeVideoUrl,
        orientationVideoTitle: safeTitle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, publicPath);
    }
  } else {
    try {
      await updateDoc(publicRef, {
        intermediatePasscodeHash: intHash,
        advancedPasscodeHash: advHash,
        intermediateGateEnabled: input.intermediateGateEnabled,
        advancedGateEnabled: input.advancedGateEnabled,
        orientationVideoUrl: safeVideoUrl,
        orientationVideoTitle: safeTitle,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, publicPath);
    }
  }

  return {
    publicGates: {
      intermediatePasscodeHash: intHash,
      advancedPasscodeHash: advHash,
      intermediateGateEnabled: input.intermediateGateEnabled,
      advancedGateEnabled: input.advancedGateEnabled,
      orientationVideoUrl: safeVideoUrl,
      orientationVideoTitle: safeTitle,
    },
    adminSettings: {
      secondaryAdminEmail: safeSecEmail,
      intermediatePasscodeLabel: safeIntCode,
      advancedPasscodeLabel: safeAdvCode,
    },
  };
}

export type SupportedWalletNetwork =
  | 'Bitcoin'
  | 'Xaman_XRPL'
  | 'XRPL'
  | 'Stellar'
  | 'EVM_TrustExtension';

export async function signInWithGoogleForWallet(): Promise<User> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          'ANDROID_POPUP_BLOCKED: Google Sign-In popup did not open on this mobile browser. Use 1-Tap Classroom Sign-Off right beside it to unlock instantly.'
        )
      );
    }, 9000);
  });

  try {
    const credential = await Promise.race([
      signInWithPopup(auth, googleProvider),
      timeoutPromise,
    ]);
    return credential.user;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function signInWithGoogleForAcademyAdmin(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutGoogleWalletGate(uid?: string): Promise<void> {
  if (uid && auth.currentUser && auth.currentUser.uid === uid && auth.currentUser.emailVerified) {
    try {
      await lockLiveWalletSessionInFirestore(uid);
    } catch {
      // Proceed with sign-out even if session doc was never created
    }
  }
  await signOut(auth);
}

export async function unlockLiveWalletSessionInFirestore(
  user: User,
  walletNetwork: SupportedWalletNetwork
): Promise<void> {
  if (!user.emailVerified) return;
  const safeUid = sanitizeFirestoreId(user.uid, 'uid_fallback', 128);
  const userPath = `users/${safeUid}`;
  const userRef = doc(db, 'users', safeUid);

  let existsAlready = false;
  try {
    const snap = await getDoc(userRef);
    existsAlready = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (!existsAlready) {
    try {
      await setDoc(userRef, {
        uid: safeUid,
        walletModeUnlocked: true,
        lastWalletNetwork: walletNetwork,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  } else {
    try {
      await updateDoc(userRef, {
        walletModeUnlocked: true,
        lastWalletNetwork: walletNetwork,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }
}

export async function lockLiveWalletSessionInFirestore(uid: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, 'uid_fallback', 128);
  const userPath = `users/${safeUid}`;
  const userRef = doc(db, 'users', safeUid);

  let existsAlready = false;
  try {
    const snap = await getDoc(userRef);
    existsAlready = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (existsAlready) {
    try {
      await updateDoc(userRef, {
        walletModeUnlocked: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }
}

export interface RecordWalletApprovalInput {
  user: User;
  walletNetwork: SupportedWalletNetwork;
  setNumber: number;
  coinTicker: 'BTC' | 'XRP' | 'XLM';
  walletTarget: 'TrustWallet' | 'Xaman' | 'TrustExtension';
  publicWalletAddress: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  markSigned?: boolean;
}

export async function recordWalletSetApprovalInFirestore(
  input: RecordWalletApprovalInput
): Promise<void> {
  const { user } = input;
  if (!user.emailVerified) return;

  // Ensure parent Master Gate session is active first
  await unlockLiveWalletSessionInFirestore(user, input.walletNetwork);

  const safeUid = sanitizeFirestoreId(user.uid, 'uid_fallback', 128);
  const clampedSet = Math.max(1, Math.min(10, Math.round(input.setNumber)));
  const approvalId = `set_${clampedSet}`;
  const approvalPath = `users/${safeUid}/walletApprovals/${approvalId}`;
  const approvalRef = doc(db, 'users', safeUid, 'walletApprovals', approvalId);

  const safeAddr = sanitizeFirestoreId(
    input.publicWalletAddress || 'SELF_CUSTODY_WALLET',
    'SELF_CUSTODY_WALLET',
    96
  );
  const safeAddressPadded = safeAddr.length >= 4 ? safeAddr : 'SELF_CUSTODY_WALLET';
  const safeBuy = Math.max(0.0001, Math.min(1000000, Number(input.buyPrice) || 0.0001));
  const safeSell = Math.max(0.0001, Math.min(1000000, Number(input.sellPrice) || 0.0001));
  const safeQty = Math.max(0.00000001, Math.min(100000000, Number(input.quantity) || 0.00005));
  const desiredStatus: 'dispatched' | 'signed' = input.markSigned ? 'signed' : 'dispatched';

  let existingStatus: string | null = null;
  try {
    const snap = await getDoc(approvalRef);
    if (snap.exists()) {
      existingStatus = (snap.data()?.status as string) || 'dispatched';
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, approvalPath);
  }

  if (existingStatus === null) {
    try {
      await setDoc(approvalRef, {
        ownerUid: safeUid,
        setNumber: clampedSet,
        coinTicker: input.coinTicker,
        walletTarget: input.walletTarget,
        publicWalletAddress: safeAddressPadded,
        buyPrice: safeBuy,
        sellPrice: safeSell,
        quantity: safeQty,
        status: desiredStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, approvalPath);
    }
    return;
  }

  // Respect terminal 'signed' state lock in firestore.rules
  if (existingStatus === 'signed') {
    return;
  }

  if (desiredStatus === 'signed') {
    try {
      await updateDoc(approvalRef, {
        status: 'signed',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, approvalPath);
    }
  } else {
    try {
      await updateDoc(approvalRef, {
        walletTarget: input.walletTarget,
        publicWalletAddress: safeAddressPadded,
        buyPrice: safeBuy,
        sellPrice: safeSell,
        quantity: safeQty,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, approvalPath);
    }
  }
}

export interface BatchTenSetItemInput {
  setNumber: number;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
}

export async function recordBatchTenSetApprovalsInFirestore(params: {
  user: User;
  walletNetwork: SupportedWalletNetwork;
  coinTicker: 'BTC' | 'XRP' | 'XLM';
  walletTarget: 'TrustWallet' | 'Xaman' | 'TrustExtension';
  publicWalletAddress: string;
  sets: BatchTenSetItemInput[];
}): Promise<void> {
  if (!params.user.emailVerified) return;
  await unlockLiveWalletSessionInFirestore(params.user, params.walletNetwork);
  for (const s of params.sets) {
    await recordWalletSetApprovalInFirestore({
      user: params.user,
      walletNetwork: params.walletNetwork,
      setNumber: s.setNumber,
      coinTicker: params.coinTicker,
      walletTarget: params.walletTarget,
      publicWalletAddress: params.publicWalletAddress,
      buyPrice: s.buyPrice,
      sellPrice: s.sellPrice,
      quantity: s.quantity,
      markSigned: false,
    });
  }
}

export { onAuthStateChanged };
export type { User };
