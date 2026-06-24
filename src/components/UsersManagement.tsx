'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  User as UserIcon, 
  UserMinus, 
  Save, 
  ArrowLeft, 
  Search, 
  Lock, 
  Unlock, 
  RefreshCw, 
  AlertTriangle 
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

  // Manejador de cambio local en campos
  const handleLocalChange = (userId: string, field: keyof UserItem, value: any) => {
    setUsers(prev => 
      prev.map(u => u.id === userId ? { ...u, [field]: value } : u)
    );
  };

  // Guardar cambios en el servidor
  const handleSaveChanges = async (user: UserItem) => {
    // Evitar que el administrador se bloquee a sí mismo
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

  return (
    <div className="w-full bg-card border border-border rounded-3xl p-6 shadow-xl transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight">Gestión de Usuarios</h2>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Seguridad y Control de Permisos
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-3 rounded-xl hover:bg-muted text-xs flex items-center gap-1 cursor-pointer"
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
          className="w-full rounded-2xl border border-input bg-background/50 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground transition-all duration-200"
        />
      </div>

      {/* Estado de Carga */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          <span>Consultando base de datos de usuarios...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
          No se encontraron usuarios registrados.
        </div>
      ) : (
        /* Grid de Usuarios (Mobile-first adaptable a lista) */
        <div className="flex flex-col gap-4">
          {filteredUsers.map((userItem) => {
            const isSelf = userItem.id === currentUser.id;
            
            return (
              <div 
                key={userItem.id} 
                className={`relative overflow-hidden rounded-2xl border bg-card/60 p-4 shadow-sm transition-all duration-200 ${
                  userItem.isBanned 
                    ? 'border-destructive/30 bg-destructive/5' 
                    : 'border-border'
                }`}
              >
                {/* Banner de Bloqueado */}
                {userItem.isBanned && (
                  <div className="absolute top-0 left-0 right-0 bg-destructive/10 text-destructive text-[9px] font-bold uppercase tracking-wider py-1 px-4 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Acceso Suspendido
                  </div>
                )}

                <div className={`${userItem.isBanned ? 'pt-4' : ''} flex flex-col gap-3`}>
                  
                  {/* Fila 1: Info básica y rol */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-foreground truncate flex items-center gap-1">
                        👤 {userItem.name} {isSelf && <span className="text-[9px] font-semibold text-muted-foreground">(Tú)</span>}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">{userItem.email}</p>
                    </div>

                    <select
                      value={userItem.role}
                      onChange={(e) => handleLocalChange(userItem.id, 'role', e.target.value)}
                      disabled={isSelf}
                      className="rounded-lg border border-input bg-background px-2 py-1 text-[10px] font-bold text-foreground outline-none cursor-pointer"
                    >
                      <option value="terapeuta">Terapeuta</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {/* Fila 2: Permisos booleanos detallados */}
                  <div className="grid grid-cols-2 gap-2 mt-1 border-t border-b border-border/40 py-3 my-1">
                    
                    {/* canRecord */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={userItem.canRecord}
                        disabled={userItem.isBanned}
                        onChange={(e) => handleLocalChange(userItem.id, 'canRecord', e.target.checked)}
                        className="rounded border-input text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] font-semibold text-foreground">Permitir dictados</span>
                    </label>

                    {/* canViewDashboard */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={userItem.canViewDashboard || userItem.role === 'admin'}
                        disabled={userItem.role === 'admin' || userItem.isBanned}
                        onChange={(e) => handleLocalChange(userItem.id, 'canViewDashboard', e.target.checked)}
                        className="rounded border-input text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] font-semibold text-foreground">Ver KPIs Dashboard</span>
                    </label>

                    {/* isBanned */}
                    <label className="flex items-center gap-2 cursor-pointer select-none col-span-2 mt-1 text-destructive">
                      <input
                        type="checkbox"
                        checked={userItem.isBanned}
                        disabled={isSelf}
                        onChange={(e) => handleLocalChange(userItem.id, 'isBanned', e.target.checked)}
                        className="rounded border-destructive/50 text-destructive focus:ring-destructive w-3.5 h-3.5"
                      />
                      <span className="text-[10px] font-bold">Suspender/Bloquear Cuenta</span>
                    </label>

                  </div>

                  {/* Fila 3: Acciones guardar/eliminar */}
                  <div className="flex justify-between items-center mt-1">
                    
                    {/* Fecha de Registro */}
                    <span className="text-[8px] text-muted-foreground">
                      Registrado: {new Date(userItem.createdAt).toLocaleDateString('es-CL')}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                        disabled={isSelf || deletingId === userItem.id}
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Eliminar Cuenta"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleSaveChanges(userItem)}
                        disabled={savingId === userItem.id}
                        className="h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 flex items-center gap-1 cursor-pointer"
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
      )}

    </div>
  );
}
