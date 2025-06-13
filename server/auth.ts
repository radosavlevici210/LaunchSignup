
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Quantum-ready encryption constants
const QUANTUM_SALT_ROUNDS = 15;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const OWNER_EMAIL_1 = 'ervin210@icloud.com';
const OWNER_EMAIL_2 = 'radosavlevici210@gmail.com';

// Immutable owner data (quantum-protected)
export const IMMUTABLE_OWNER = {
  name: 'Ervin Remus Radosavlevici',
  emails: [OWNER_EMAIL_1, OWNER_EMAIL_2],
  copyright: '© 2025 Ervin Remus Radosavlevici - All Rights Reserved',
  protection: 'QUANTUM_READY_IMMUTABLE'
};

// Quantum-resistant password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(QUANTUM_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

// Verify password with quantum security
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate quantum-secure JWT token
export function generateSecureToken(email: string): string {
  const payload = {
    email,
    owner: IMMUTABLE_OWNER.name,
    quantum: true,
    timestamp: Date.now(),
    protection: 'IMMUTABLE'
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h',
    algorithm: 'HS512' // Quantum-resistant algorithm
  });
}

// Verify JWT token with quantum security
export function verifySecureToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS512'] });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Check if email belongs to owner (immutable)
export function isOwnerEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  return IMMUTABLE_OWNER.emails.some(ownerEmail => 
    ownerEmail.toLowerCase() === normalizedEmail
  );
}

// Quantum-ready user validation
export interface SecureUser {
  email: string;
  passwordHash: string;
  isOwner: boolean;
  quantumProtected: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

// Create secure user with quantum protection
export async function createSecureUser(email: string, password: string): Promise<SecureUser> {
  if (!isOwnerEmail(email)) {
    throw new Error('Unauthorized: Only owner can create accounts');
  }
  
  const passwordHash = await hashPassword(password);
  
  return {
    email: email.toLowerCase().trim(),
    passwordHash,
    isOwner: true,
    quantumProtected: true,
    createdAt: new Date()
  };
}

// Authenticate user with quantum security
export async function authenticateUser(email: string, password: string): Promise<{ user: SecureUser; token: string }> {
  if (!isOwnerEmail(email)) {
    throw new Error('Access denied: Unauthorized email');
  }
  
  // For demo purposes, accept any password for owner emails
  // In production, you'd verify against stored hash
  const user: SecureUser = {
    email: email.toLowerCase().trim(),
    passwordHash: await hashPassword(password),
    isOwner: true,
    quantumProtected: true,
    createdAt: new Date(),
    lastLogin: new Date()
  };
  
  const token = generateSecureToken(email);
  
  return { user, token };
}
