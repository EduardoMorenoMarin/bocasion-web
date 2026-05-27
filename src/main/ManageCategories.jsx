import React, { useState, useEffect } from 'react';

import {
  ref,
  onValue,
  push,
  set,
  remove,
  update
} from 'firebase/database';

import { db } from '../../config/firebase';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/common/Card';

import {
  Input
} from '../../components/common/Input';

import {
  Button
} from '../../components/common/Button';

import {
  Badge
} from '../../components/common/Badge';

import {

  FolderPlus,
  Layers,
  Trash2,
  Pencil,
  Package,
  X,
  AlertTriangle

} from 'lucide-react';

export function ManageCategories() {

  const [categories, setCategories] = useState([]);

  const [items, setItems] = useState([]);

  // ============================================
  // CREATE
  // ============================================

  const [name, setName] = useState('');

  const [description, setDescription] =
    useState('');

  // ============================================
  // EDIT MODAL
  // ============================================

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [editName, setEditName] =
    useState('');

  const [editDescription, setEditDescription] =
    useState('');

  // ============================================
  // STATES
  // ============================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  // ============================================
  // REALTIME SYNC
  // ============================================

  useEffect(() => {

    const categoriesRef =
      ref(db, 'categories');

    onValue(categoriesRef, (snapshot) => {

      const data = [];

      if (snapshot.exists()) {

        snapshot.forEach((child) => {

          data.push({
            id: child.key,
            ...child.val()
          });
        });
      }

      setCategories(data);
    });

    const itemsRef =
      ref(db, 'items');

    onValue(itemsRef, (snapshot) => {

      const data = [];

      if (snapshot.exists()) {

        snapshot.forEach((child) => {

          data.push({
            id: child.key,
            ...child.val()
          });
        });
      }

      setItems(data);
    });

  }, []);

  // ============================================
  // ADD CATEGORY
  // ============================================

  const handleAddCategory = async (e) => {

    e.preventDefault();

    setError('');
    setSuccess('');

    if (
      !name.trim() ||
      !description.trim()
    ) {

      setError(
        'Completa todos los campos.'
      );

      return;
    }

    try {

      setLoading(true);

      const newCategoryRef =
        push(ref(db, 'categories'));

      await set(newCategoryRef, {

        id: newCategoryRef.key,

        name: name.trim(),

        description:
          description.trim(),

        createdAt:
          Date.now()
      });

      setSuccess(
        `Categoría "${name}" creada correctamente.`
      );

      setName('');
      setDescription('');

    } catch (err) {

      setError(
        'Error al crear categoría.'
      );

      console.error(err);

    } finally {

      setLoading(false);
    }
  };

  // ============================================
  // DELETE CATEGORY
  // ============================================

  const handleDeleteCategory = async (cat) => {

    const linkedItems =
      items.filter(
        i => i.categoryId === cat.id
      );

    if (linkedItems.length > 0) {

      alert(
        `No puedes eliminar esta categoría porque tiene ${linkedItems.length} productos asociados.`
      );

      return;
    }

    const confirmDelete =
      confirm(
        `¿Eliminar categoría "${cat.name}"?`
      );

    if (!confirmDelete) return;

    try {

      await remove(
        ref(
          db,
          `categories/${cat.id}`
        )
      );

    } catch (err) {

      console.error(err);

      alert(
        'Error al eliminar categoría.'
      );
    }
  };

  // ============================================
  // OPEN EDIT
  // ============================================

  const openEditModal = (cat) => {

    setEditingCategory(cat);

    setEditName(cat.name || '');

    setEditDescription(
      cat.description || ''
    );
  };

  // ============================================
  // UPDATE CATEGORY
  // ============================================

  const handleUpdateCategory = async (e) => {

    e.preventDefault();

    if (!editingCategory) return;

    try {

      const categoryRef =
        ref(
          db,
          `categories/${editingCategory.id}`
        );

      await update(categoryRef, {

        name: editName.trim(),

        description:
          editDescription.trim()
      });

      setEditingCategory(null);

    } catch (err) {

      console.error(err);

      alert(
        'Error al actualizar categoría.'
      );
    }
  };

  // ============================================
  // PRODUCTS COUNT
  // ============================================

  const getProductsCount = (catId) => {

    return items.filter(
      i => i.categoryId === catId
    ).length;
  };

  return (

    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">

      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}

      <div className="flex items-center gap-3">

        <Layers
          className="h-8 w-8"
          style={{
            color: '#4DB6AC'
          }}
        />

        <h1 className="text-3xl font-bold font-[Poppins] text-white">

          Gestión de Categorías

        </h1>

      </div>

      {/* ============================================ */}
      {/* GRID */}
      {/* ============================================ */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ============================================ */}
        {/* FORM */}
        {/* ============================================ */}

        <Card className="bg-[var(--color-card)] border-white/5 shadow-xl h-fit">

          <CardHeader>

            <CardTitle
              className="text-lg flex items-center gap-2"
              style={{
                color: '#4DB6AC'
              }}
            >

              <FolderPlus className="h-5 w-5" />

              Nueva Categoría

            </CardTitle>

          </CardHeader>

          <CardContent>

            <form
              onSubmit={handleAddCategory}
              className="space-y-4"
            >

              <div className="space-y-2">

                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">

                  Nombre

                </label>

                <Input
                  placeholder="Ej. Hamburguesas"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="bg-[var(--color-card-dark)] border-[#4DB6AC]/20 text-white"
                />

              </div>

              <div className="space-y-2">

                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">

                  Descripción

                </label>

                <textarea
                  placeholder="Describe la categoría..."
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows="4"
                  className="w-full bg-[var(--color-card-dark)] border border-[#4DB6AC]/20 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#4DB6AC]"
                />

              </div>

              {error && (

                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl font-medium">

                  {error}

                </div>
              )}

              {success && (

                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl font-medium">

                  {success}

                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold text-black"
                style={{
                  backgroundColor: '#4DB6AC'
                }}
              >

                {loading
                  ? 'Guardando...'
                  : 'Crear Categoría'}

              </Button>

            </form>

          </CardContent>

        </Card>

        {/* ============================================ */}
        {/* LIST */}
        {/* ============================================ */}

        <div className="lg:col-span-2 space-y-4">

          <div className="flex items-center justify-between">

            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">

              Categorías Registradas

            </h2>

            <Badge variant="neutral">

              {categories.length} categorías

            </Badge>

          </div>

          {categories.length === 0 ? (

            <Card className="bg-[var(--color-card)] border-white/5">

              <CardContent className="p-10 text-center space-y-3">

                <Layers className="h-12 w-12 text-slate-700 mx-auto" />

                <p className="text-sm text-slate-500">

                  No existen categorías registradas.

                </p>

              </CardContent>

            </Card>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {categories.map((cat) => {

                const totalProducts =
                  getProductsCount(cat.id);

                return (

                  <Card
                    key={cat.id}
                    className="bg-[var(--color-card)] border-white/5 overflow-hidden"
                  >

                    <CardContent className="p-5 space-y-4">

                      <div className="flex items-start justify-between gap-3">

                        <div className="space-y-1">

                          <h3 className="text-lg font-black text-white">

                            {cat.name}

                          </h3>

                          <p className="text-xs text-slate-400 leading-relaxed">

                            {cat.description}

                          </p>

                        </div>

                        <div className="h-12 w-12 rounded-2xl bg-[#4DB6AC]/10 flex items-center justify-center">

                          <Layers
                            className="h-5 w-5"
                            style={{
                              color: '#4DB6AC'
                            }}
                          />

                        </div>

                      </div>

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <Package className="h-4 w-4 text-slate-500" />

                          <span className="text-xs text-slate-400 font-medium">

                            Productos:

                          </span>

                        </div>

                        <Badge
                          variant={
                            totalProducts > 0
                              ? 'success'
                              : 'warning'
                          }
                        >

                          {totalProducts}

                        </Badge>

                      </div>

                      {totalProducts > 0 && (

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">

                          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />

                          <p className="text-[11px] text-amber-300 leading-relaxed">

                            Esta categoría tiene productos asociados.

                          </p>

                        </div>
                      )}

                    </CardContent>

                    {/* FOOTER */}

                    <div className="bg-[var(--color-card-dark)] border-t border-white/5 px-4 py-3 flex items-center justify-between">

                      <span className="text-[10px] font-mono text-slate-500">

                        ID: {cat.id}

                      </span>

                      <div className="flex items-center gap-2">

                        <button
                          onClick={() =>
                            openEditModal(cat)
                          }
                          className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-all"
                        >

                          <Pencil className="h-4 w-4" />

                        </button>

                        <button
                          onClick={() =>
                            handleDeleteCategory(cat)
                          }
                          className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-all"
                        >

                          <Trash2 className="h-4 w-4" />

                        </button>

                      </div>

                    </div>

                  </Card>
                );
              })}

            </div>
          )}

        </div>

      </div>

      {/* ============================================ */}
      {/* EDIT MODAL */}
      {/* ============================================ */}

      {editingCategory && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <Card className="w-full max-w-lg bg-[var(--color-card)] border-white/10 relative">

            <button
              onClick={() =>
                setEditingCategory(null)
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >

              <X className="h-5 w-5" />

            </button>

            <CardContent className="p-6 space-y-5">

              <div className="space-y-1">

                <h2 className="text-2xl font-black text-white">

                  Editar Categoría

                </h2>

                <p className="text-xs text-slate-500">

                  Modifica la información registrada.

                </p>

              </div>

              <form
                onSubmit={handleUpdateCategory}
                className="space-y-4"
              >

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

                <div className="space-y-2">

                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400">

                    Descripción

                  </label>

                  <textarea
                    rows="4"
                    value={editDescription}
                    onChange={(e) =>
                      setEditDescription(e.target.value)
                    }
                    className="w-full bg-[var(--color-card-dark)] border border-white/5 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#4DB6AC]"
                  />

                </div>

                <div className="flex gap-3 pt-2">

                  <Button
                    type="button"
                    onClick={() =>
                      setEditingCategory(null)
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