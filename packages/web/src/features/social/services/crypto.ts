/**
 * End-to-End Encryption (E2EE) using Web Crypto API
 * - RSA-OAEP for key exchange
 * - AES-GCM for content encryption
 */

// Helper to convert ArrayBuffer or TypedArray to Base64
const bufferToBase64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  return btoa(String.fromCharCode(...bytes));
};

// Helper to convert Base64 to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: bufferToBase64(publicKey),
    privateKey: bufferToBase64(privateKey),
  };
}

export async function encryptMessage(content: string, recipientPublicKeyBase64: string) {
  // 1. Generate a random AES key for this message
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Encrypt the content with AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedContent = new TextEncoder().encode(content);
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedContent
  );

  // 3. Encrypt the AES key with the recipient's RSA public key
  const recipientPublicKey = await window.crypto.subtle.importKey(
    "spki",
    base64ToBuffer(recipientPublicKeyBase64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    exportedAesKey
  );

  // Return base64 strings
  return {
    encryptedContent: bufferToBase64(encryptedContent),
    encryptedKey: bufferToBase64(encryptedAesKey),
    iv: bufferToBase64(iv),
  };
}

export async function decryptMessage(
  encryptedContentBase64: string,
  encryptedKeyBase64: string,
  ivBase64: string,
  privateKeyBase64: string
) {
  try {
    // 1. Import your private RSA key
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      base64ToBuffer(privateKeyBase64),
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    // 2. Decrypt the AES key
    const decryptedAesKeyBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      base64ToBuffer(encryptedKeyBase64)
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedAesKeyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // 3. Decrypt the content
    const decryptedContentBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuffer(ivBase64) },
      aesKey,
      base64ToBuffer(encryptedContentBase64)
    );

    return new TextDecoder().decode(decryptedContentBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Mensaje Encriptado - Error al desencriptar]";
  }
}
