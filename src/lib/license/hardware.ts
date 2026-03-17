import { createHash } from 'crypto';
import os from 'os';

/**
 * Derives a stable hardware fingerprint from OS-level identifiers.
 *
 * Components used:
 *   - hostname   — set during deployment, stable per machine
 *   - platform   — linux / win32 / darwin
 *   - arch       — x64 / arm64
 *   - CPU model  — stable per physical machine config
 *   - Total RAM  — stable per physical machine config
 *
 * Returns a 32-character hex string (truncated SHA-256).
 *
 * NOTE: For a stronger fingerprint in production, install `node-machine-id`
 * and replace this with `machineIdSync()`. The current implementation is
 * sufficient for appliance deployments where the hostname is fixed.
 */
export function getHardwareFingerprint(): string {
    const components = [
        os.hostname(),
        os.platform(),
        os.arch(),
        os.cpus()[0]?.model ?? 'unknown-cpu',
        String(os.totalmem()),
    ];

    const raw = components.join('|');
    return createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

/**
 * Returns a human-readable summary of the machine identity (for display in Settings → License tab).
 */
export function getHardwareSummary(): string {
    return [
        `Host: ${os.hostname()}`,
        `OS: ${os.platform()} (${os.arch()})`,
        `CPU: ${os.cpus()[0]?.model ?? 'Unknown'}`,
        `RAM: ${(os.totalmem() / 1073741824).toFixed(1)} GB`,
    ].join(' · ');
}
