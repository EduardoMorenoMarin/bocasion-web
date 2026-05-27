import React, {
  useState,
  useEffect
} from 'react';

import {
  ref,
  onValue,
  update,
  remove
} from 'firebase/database';

import { db } from '../../config/firebase';

import {
  useAuthStore
} from '../../store/useAuthStore';

import {
  Card,
  CardContent
} from '../../components/common/Card';

import {
  Button
} from '../../components/common/Button';

import {
  Badge
} from '../../components/common/Badge';

import {
  Input
} from '../../components/common/Input';

import {

  Users,
  Shield,
  UserCog,
  X,
  Trash2,
  Crown,
  ChefHat,
  User,
  Mail,
  AlertTriangle

} from 'lucide-react';

export function ManageUsers() {

  const [users, setUsers] =
    useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  // ============================================
  // CURRENT USER
  // ============================================

  const {
    user: currentUser
  } = useAuthStore();

  // ============================================
  // EDIT STATES
  // ============================================

  const [editName, setEditName] =
    useState('');

  const [editRole, setEditRole] =
    useState('');

  // ============================================
  // SEARCH
  // ============================================

  const [search, setSearch] =
    useState('');

  // ============================================
  // REALTIME SYNC
  // ============================================

  useEffect(() => {

    const usersRef =
      ref(db, 'users');

    onValue(usersRef, (snapshot) => {

      const list = [];

      if (snapshot.exists()) {

        snapshot.forEach((child) => {

          list.push({

            id: child.key,
            ...child.val()
          });
        });
      }

      setUsers(list);

    });

  }, []);

  // ============================================
  // OPEN MODAL
  // ============================================

  const openEditModal = (user) => {

    setSelectedUser(user);

    setEditName(
      user.name || ''
    );

    setEditRole(
      user.role || 'usuario'
    );
  };

  // ============================================
  // UPDATE USER
  // ============================================

  const handleUpdateUser = async (e) => {

    e.preventDefault();

    if (!selectedUser) return;

    try {

      const userRef =
        ref(
          db,
          `users/${selectedUser.id}`
        );

      const updates = {

        name: editName.trim(),

        role: editRole
      };

      await update(
        userRef,
        updates
      );

      setSelectedUser(null);

    } catch (err) {

      console.error(err);

      alert(
        'Error al actualizar usuario.'
      );
    }
  };

  // ============================================
  // DELETE USER
  // ============================================

  const handleDeleteUser = async (user) => {

    // NO BORRARSE A SÍ MISMO

    if (
      user.id === currentUser?.uid
    ) {

      alert(
        'No puedes eliminar tu propia cuenta.'
      );

      return;
    }

    const confirmDelete =
      confirm(
        `¿Eliminar usuario "${user.name}"?`
      );

    if (!confirmDelete) return;

    try {

      await remove(
        ref(
          db,
          `users/${user.id}`
        )
      );

    } catch (err) {

      console.error(err);

      alert(
        'Error al eliminar usuario.'
      );
    }
  };

  // ============================================
  // FILTER USERS
  // ============================================

  const filteredUsers =
    users.filter((u) => {

      const text =
        `${u.name} ${u.email} ${u.role}`
          .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  // ============================================
  // BADGE
  // ============================================

  const getRoleBadgeVariant = (role) => {

    if (role === 'admin') {

      return 'danger';
    }

    if (role === 'cocinero') {

      return 'warning';
    }

    return 'neutral';
  };

  // ============================================
  // ROLE ICON
  // ============================================

  const getRoleIcon = (role) => {

    if (role === 'admin') {

      return Crown;
    }

    if (role === 'cocinero') {

      return ChefHat;
    }

    return User;
  };

  return (

    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">

      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <Users
            className="h-8 w-8"
            style={{
              color: '#4DB6AC'
            }}
          />

          <div>

            <h1 className="text-3xl font-bold font-[Poppins] text-white">

              Gestión de Usuarios

            </h1>

            <p className="text-sm text-slate-500 mt-1">

              Administración del personal y clientes registrados

            </p>

          </div>

        </div>

        {/* SEARCH */}

        <div className="w-full lg:w-80">

          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="bg-[var(--color-card)] border-white/5 text-white"
          />

        </div>

      </div>

      {/* ============================================ */}
      {/* ALERT */}
      {/* ============================================ */}

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">

        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />

        <div className="space-y-1">

          <p className="text-sm font-bold text-amber-300">

            Restricciones del Sistema

          </p>

          <p className="text-xs text-amber-200/80 leading-relaxed">

            Los cambios de contraseña deben realizarse desde Firebase Authentication.
            Este panel administra únicamente roles y datos visibles.

          </p>

        </div>

      </div>

      {/* ============================================ */}
      {/* STATS */}
      {/* ============================================ */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <StatCard
          label="Usuarios"
          value={users.length}
          icon={Users}
          color="cyan"
        />

        <StatCard
          label="Administradores"
          value={
            users.filter(
              u => u.role === 'admin'
            ).length
          }
          icon={Crown}
          color="rose"
        />

        <StatCard
          label="Cocineros"
          value={
            users.filter(
              u => u.role === 'cocinero'
            ).length
          }
          icon={ChefHat}
          color="amber"
        />

      </div>

      {/* ============================================ */}
      {/* USERS GRID */}
      {/* ============================================ */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {filteredUsers.map((u) => {

          const RoleIcon =
            getRoleIcon(u.role);

          return (

            <Card
              key={u.id}
              className="bg-[var(--color-card)] border-white/5 overflow-hidden"
            >

              <CardContent className="p-5 space-y-5">

                {/* TOP */}

                <div className="flex items-start gap-4">

                  <div className="h-14 w-14 rounded-2xl bg-[var(--color-card-dark)] border border-white/5 flex items-center justify-center text-white font-black text-lg">

                    {u.name
                      ? u.name.charAt(0).toUpperCase()
                      : 'U'}

                  </div>

                  <div className="space-y-1 flex-1">

                    <div className="flex items-center gap-2 flex-wrap">

                      <h2 className="font-black text-white text-lg">

                        {u.name || 'Sin nombre'}

                      </h2>

                      {u.id === currentUser?.uid && (

                        <Badge variant="success">

                          Tú

                        </Badge>
                      )}

                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 break-all">

                      <Mail className="h-3.5 w-3.5" />

                      {u.email}

                    </div>

                  </div>

                </div>

                {/* ROLE */}

                <div className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-4 flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <RoleIcon className="h-4 w-4 text-[#4DB6AC]" />

                    <span className="text-xs uppercase tracking-widest font-bold text-slate-400">

                      Rol

                    </span>

                  </div>

                  <Badge
                    variant={
                      getRoleBadgeVariant(u.role)
                    }
                  >

                    {u.role || 'usuario'}

                  </Badge>

                </div>

                {/* FOOTER */}

                <div className="flex gap-3">

                  <Button
                    onClick={() =>
                      openEditModal(u)
                    }
                    className="w-full flex items-center gap-2 justify-center bg-[#4DB6AC] text-black font-bold hover:opacity-90"
                  >

                    <UserCog className="h-4 w-4" />

                    Editar

                  </Button>

                  <Button
                    onClick={() =>
                      handleDeleteUser(u)
                    }
                    disabled={
                      u.id === currentUser?.uid
                    }
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10"
                  >

                    <Trash2 className="h-4 w-4" />

                  </Button>

                </div>

              </CardContent>

            </Card>
          );
        })}

      </div>

      {/* ============================================ */}
      {/* EMPTY */}
      {/* ============================================ */}

      {filteredUsers.length === 0 && (

        <Card className="bg-[var(--color-card)] border-white/5">

          <CardContent className="p-12 text-center space-y-3">

            <Users className="h-14 w-14 text-slate-700 mx-auto" />

            <p className="text-slate-500 text-sm">

              No se encontraron usuarios.

            </p>

          </CardContent>

        </Card>
      )}

      {/* ============================================ */}
      {/* EDIT MODAL */}
      {/* ============================================ */}

      {selectedUser && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <Card className="w-full max-w-lg bg-[var(--color-card)] border-white/10 relative">

            {/* CLOSE */}

            <button
              onClick={() =>
                setSelectedUser(null)
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >

              <X className="h-5 w-5" />

            </button>

            <CardContent className="p-6 space-y-5">

              {/* HEADER */}

              <div className="space-y-1">

                <h2 className="text-2xl font-black text-white">

                  Editar Usuario

                </h2>

                <p className="text-xs text-slate-500 break-all">

                  ID: {selectedUser.id}

                </p>

              </div>

              {/* FORM */}

              <form
                onSubmit={handleUpdateUser}
                className="space-y-4"
              >

                {/* NAME */}

                <div className="space-y-2">

                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400">

                    Nombre

                  </label>

                  <Input
                    value={editName}
                    onChange={(e) =>
                      setEditName(e.target.value)
                    }
                    className="bg-[var(--color-card-dark)] border-white/5 text-white"
                  />

                </div>

                {/* ROLE */}

                <div className="space-y-2">

                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400">

                    Rol

                  </label>

                  <select
                    value={editRole}
                    onChange={(e) =>
                      setEditRole(e.target.value)
                    }
                    disabled={
                      selectedUser.id === currentUser?.uid
                    }
                    className="w-full bg-[var(--color-card-dark)] border border-white/5 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#4DB6AC]"
                  >

                    <option value="usuario">

                      Usuario

                    </option>

                    <option value="cocinero">

                      Cocinero

                    </option>

                    <option value="admin">

                      Administrador

                    </option>

                  </select>

                  {selectedUser.id === currentUser?.uid && (

                    <p className="text-[11px] text-amber-400">

                      No puedes modificar tu propio rol.

                    </p>
                  )}

                </div>

                {/* ACTIONS */}

                <div className="flex gap-3 pt-2">

                  <Button
                    type="button"
                    onClick={() =>
                      setSelectedUser(null)
                    }
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                  >

                    Cancelar

                  </Button>

                  <Button
                    type="submit"
                    className="w-full font-bold text-black"
                    style={{
                      backgroundColor: '#4DB6AC'
                    }}
                  >

                    Guardar Cambios

                  </Button>

                </div>

              </form>

            </CardContent>

          </Card>

        </div>
      )}

    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color
}) {

  const colors = {

    cyan: 'bg-cyan-500/10 text-cyan-400',
    rose: 'bg-rose-500/10 text-rose-400',
    amber: 'bg-amber-500/10 text-amber-400'
  };

  return (

    <Card className="bg-[var(--color-card)] border-white/5">

      <CardContent className="p-5 flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">

            {label}

          </p>

          <h2 className="text-3xl font-black text-white">

            {value}

          </h2>

        </div>

        <div className={`p-4 rounded-2xl ${colors[color]}`}>

          <Icon className="h-6 w-6" />

        </div>

      </CardContent>

    </Card>
  );
}