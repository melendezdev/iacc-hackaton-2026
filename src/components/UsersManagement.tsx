'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  UserMinus, 
  Save, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { obtenerUsuarios, actualizarUsuarioPermisos, eliminarUsuario } from '@/app/actions';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'terapeuta' | 'admin';
  canRecord: boolean;
  canViewDashboard: boolean;
  isBanned: boolean;
  createdAt: any;
}

interface UsersManagementProps {
  currentUser: { id: string };
  onBack: () => void;
}

export function UsersManagement({ currentUser, onBack }: UsersManagementProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar lista de usuarios
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await obtenerUsuarios();
      if (res.success && res.users) {
        setUsers(res.users as UserItem[]);
      } else {
        toast.error('Error cargando usuarios', {
          description: res.error || 'No se pudieron recuperar los terapeutas.',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de servidor', {
        description: 'Inténtalo de nuevo en unos minutos.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Resetear a la página 1 cuando se busque
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Manejador de cambio local en campos
  const handleLocalChange = (userId: string, field: keyof UserItem, value: any) => {
    setUsers(prev => 
      prev.map(u => u.id === userId ? { ...u, [field]: value } : u)
    );
  };

  // Guardar cambios en el servidor
  const handleSaveChanges = async (user: UserItem) => {
    if (user.id === currentUser.id && user.isBanned) {
      toast.warning('Operación bloqueada', {
        description: 'No puedes bloquear tu propia cuenta de administrador.',
      });
      return;
    }

    setSavingId(user.id);
    try {
      const res = await actualizarUsuarioPermisos(user.id, {
        role: user.role,
        canRecord: user.canRecord,
        canViewDashboard: user.canViewDashboard,
        isBanned: user.isBanned,
      });

      if (res.success) {
        toast.success('Permisos actualizados', {
          description: `Se guardaron los cambios para ${user.name}.`,
        });
      } else {
        toast.error('Error al guardar', {
          description: res.error,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red', {
        description: 'No se pudo guardar la configuración.',
      });
    } finally {
      setSavingId(null);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      toast.warning('Operación inválida', {
        description: 'No puedes eliminar tu propia cuenta de administrador.',
      });
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${userName}? Esta acción eliminará su registro de autenticación.`)) {
      return;
    }

    setDeletingId(userId);
    try {
      const res = await eliminarUsuario(userId);
      if (res.success) {
        toast.success('Usuario eliminado', {
          description: `La cuenta de ${userName} fue borrada exitosamente.`,
        });
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        toast.error('Error al eliminar', {
          description: res.error,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red', {
        description: 'No se pudo eliminar el usuario.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(
    u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Paginación de usuarios
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full bg-card border border-border rounded-lg p-6 shadow-md transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-secondary/10 text-secondary">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight">Gestión de Usuarios</h2>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Control de Accesos y Permisos
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-3 rounded hover:bg-muted text-xs flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar terapeutas por nombre o correo..."
          className="w-full rounded border border-input bg-background/50 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground transition-all duration-200"
        />
      </div>

      {/* Estado de Carga */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
          <span>Consultando base de datos de usuarios...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
          No se encontraron usuarios registrados.
        </div>
      ) : (
        <>
          {/* VISTA 1: TABLA PROFESIONAL (Disponible en Escritorio/Tablet) */}
          <div className="hidden md:block overflow-x-auto rounded border border-border/80 bg-background/30">
            <table className="w-full border-collapse text-[11px] text-muted-foreground">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-3 text-left">Usuario / Email</th>
                  <th className="p-3 text-left w-36">Rol</th>
                  <th className="p-3 text-center w-28">Permiso: Dictar</th>
                  <th className="p-3 text-center w-28">Permiso: KPIs</th>
                  <th className="p-3 text-center w-28">Estado Acceso</th>
                  <th className="p-3 text-left w-24">Registro</th>
                  <th className="p-3 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((userItem) => {
                  const isSelf = userItem.id === currentUser.id;
                  return (
                    <tr 
                      key={userItem.id} 
                      className={`border-b border-border/60 hover:bg-muted/10 transition-colors ${
                        userItem.isBanned ? 'bg-destructive/[0.02]' : ''
                      }`}
                    >
                      {/* Info */}
                      <td className="p-3">
                        <div className="font-bold text-foreground truncate max-w-[220px]">
                          {userItem.name} {isSelf && <span className="text-[9px] font-semibold text-muted-foreground">(Tú)</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                          {userItem.email}
                        </div>
                      </td>

                      {/* Rol Selector */}
                      <td className="p-3">
                        <select
                          value={userItem.role}
                          onChange={(e) => handleLocalChange(userItem.id, 'role', e.target.value)}
                          disabled={isSelf || userItem.isBanned}
                          className="rounded border border-input bg-background px-2 py-1 text-[10px] font-semibold text-foreground outline-none cursor-pointer w-full"
                        >
                          <option value="terapeuta">Terapeuta</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>

                      {/* canRecord */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={userItem.canRecord}
                          disabled={userItem.isBanned}
                          onChange={(e) => handleLocalChange(userItem.id, 'canRecord', e.target.checked)}
                          className="rounded border-input text-secondary focus:ring-secondary w-3.5 h-3.5 cursor-pointer mx-auto"
                        />
                      </td>

                      {/* canViewDashboard */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={userItem.canViewDashboard || userItem.role === 'admin'}
                          disabled={userItem.role === 'admin' || userItem.isBanned}
                          onChange={(e) => handleLocalChange(userItem.id, 'canViewDashboard', e.target.checked)}
                          className="rounded border-input text-secondary focus:ring-secondary w-3.5 h-3.5 cursor-pointer mx-auto"
                        />
                      </td>

                      {/* isBanned */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={userItem.isBanned}
                            disabled={isSelf}
                            onChange={(e) => handleLocalChange(userItem.id, 'isBanned', e.target.checked)}
                            className="rounded border-destructive/50 text-destructive focus:ring-destructive w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className={`text-[9px] font-bold ${userItem.isBanned ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {userItem.isBanned ? 'Bloqueado' : 'Activo'}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="p-3 text-muted-foreground">
                        {new Date(userItem.createdAt).toLocaleDateString('es-CL')}
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                            disabled={isSelf || deletingId === userItem.id}
                            className="w-7 h-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Eliminar Cuenta"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            onClick={() => handleSaveChanges(userItem)}
                            disabled={savingId === userItem.id}
                            className="w-7 h-7 rounded bg-secondary hover:bg-secondary/90 text-white flex items-center justify-center cursor-pointer shadow-sm"
                            title="Guardar Cambios"
                          >
                            {savingId === userItem.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* VISTA 2: LISTADO RESPONSIVO (Disponible en Celular) */}
          <div className="block md:hidden flex flex-col gap-4">
            {paginatedUsers.map((userItem) => {
              const isSelf = userItem.id === currentUser.id;
              return (
                <div 
                  key={userItem.id} 
                  className={`relative overflow-hidden rounded border bg-card/60 p-4 shadow-sm transition-all duration-200 ${
                    userItem.isBanned 
                      ? 'border-destructive/30 bg-destructive/[0.02]' 
                      : 'border-border'
                  }`}
                >
                  {userItem.isBanned && (
                    <div className="absolute top-0 left-0 right-0 bg-destructive/10 text-destructive text-[8px] font-bold uppercase tracking-wider py-0.5 px-3 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Acceso Suspendido
                    </div>
                  )}

                  <div className={`${userItem.isBanned ? 'pt-3' : ''} flex flex-col gap-3 text-[11px]`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground truncate">
                          👤 {userItem.name} {isSelf && <span className="text-[9px] font-semibold text-muted-foreground">(Tú)</span>}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate">{userItem.email}</p>
                      </div>

                      <select
                        value={userItem.role}
                        onChange={(e) => handleLocalChange(userItem.id, 'role', e.target.value)}
                        disabled={isSelf || userItem.isBanned}
                        className="rounded border border-input bg-background px-2 py-0.5 text-[10px] font-bold text-foreground outline-none cursor-pointer"
                      >
                        <option value="terapeuta">Terapeuta</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1 border-t border-b border-border/40 py-2.5 my-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={userItem.canRecord}
                          disabled={userItem.isBanned}
                          onChange={(e) => handleLocalChange(userItem.id, 'canRecord', e.target.checked)}
                          className="rounded border-input text-secondary focus:ring-secondary w-3.5 h-3.5"
                        />
                        <span className="font-semibold text-foreground">Permitir dictados</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={userItem.canViewDashboard || userItem.role === 'admin'}
                          disabled={userItem.role === 'admin' || userItem.isBanned}
                          onChange={(e) => handleLocalChange(userItem.id, 'canViewDashboard', e.target.checked)}
                          className="rounded border-input text-secondary focus:ring-secondary w-3.5 h-3.5"
                        />
                        <span className="font-semibold text-foreground">Ver KPIs Dashboard</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none col-span-2 mt-1 text-destructive">
                        <input
                          type="checkbox"
                          checked={userItem.isBanned}
                          disabled={isSelf}
                          onChange={(e) => handleLocalChange(userItem.id, 'isBanned', e.target.checked)}
                          className="rounded border-destructive/50 text-destructive focus:ring-destructive w-3.5 h-3.5"
                        />
                        <span className="font-bold">Suspender Acceso</span>
                      </label>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[8px] text-muted-foreground">
                        Registrado: {new Date(userItem.createdAt).toLocaleDateString('es-CL')}
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                          disabled={isSelf || deletingId === userItem.id}
                          className="w-7 h-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleSaveChanges(userItem)}
                          disabled={savingId === userItem.id}
                          className="h-7 rounded bg-secondary hover:bg-secondary/90 text-white text-[10px] font-bold px-3 flex items-center gap-1 cursor-pointer"
                        >
                          {savingId === userItem.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CONTROLES DE PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" /> Anterior
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 w-7 rounded text-[10px] font-bold p-0 cursor-pointer ${
                      currentPage === page ? 'bg-secondary text-white border-secondary' : ''
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  Siguiente <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
