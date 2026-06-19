let activeWorkspaceId: string | null = null;

export function setActiveWorkspaceId(workspaceId: string | null): void {
  activeWorkspaceId = workspaceId;
}

export function getWorkspaceId(): string {
  if (activeWorkspaceId) return activeWorkspaceId;
  throw new Error('No hay un espacio de trabajo activo. Inicia sesión de nuevo.');
}

export function hasActiveWorkspace(): boolean {
  return Boolean(activeWorkspaceId);
}
