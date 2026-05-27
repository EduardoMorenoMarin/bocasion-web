import React, {
  useState,
  useEffect
} from 'react';

import {
  ref,
  onValue,
  push,
  set,
  update,
  remove
} from 'firebase/database';

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

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

  PlusCircle,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  X,
  Search,
  Package,
  AlertTriangle,
  Image as ImageIcon

} from 'lucide-react';

export function ManageItems() {

  const [items, setItems] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  // ============================================
  // CREATE
  // ============================================

  const [name, setName] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [stock, setStock] =
    useState('');

  const [categoryId, setCategoryId] =
    useState('');

  const [imageUrl, setImageUrl] =
    useState('');

  // ============================================
  // IMAGE STORAGE
  // ============================================

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [previewImage, setPreviewImage] =
    useState('');

  const storage =
    getStorage();

  // ============================================
  // SEARCH
  // ============================================

  const [search, setSearch] =
    useState('');

  // ============================================
  // VIEW MODAL
  // ============================================

  const [viewingItem, setViewingItem] =
    useState(null);

  // ============================================
  // EDIT MODAL
  // ============================================

  const [editingItem, setEditingItem] =
    useState(null);

  const [editName, setEditName] =
    useState('');

  const [editDescription, setEditDescription] =
    useState('');

  const [editPrice, setEditPrice] =
    useState('');

  const [editStock, setEditStock] =
    useState('');

  const [editCategoryId, setEditCategoryId] =
    useState('');

  const [editImageUrl, setEditImageUrl] =
    useState('');

  // ============================================
  // STATES
  // ============================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  // ============================================
  // REALTIME
  // ============================================

  useEffect(() => {

    const catRef =
      ref(db, 'categories');

    onValue(catRef, (snap) => {

      const cats = [];

      if (snap.exists()) {

        snap.forEach((c) => {

          cats.push({

            id: c.key,
            ...c.val()
          });
        });
      }

      setCategories(cats);
    });

    const itemsRef =
      ref(db, 'items');

    onValue(itemsRef, (snap) => {

      const list = [];

      if (snap.exists()) {

        snap.forEach((i) => {

          list.push({

            id: i.key,
            ...i.val()
          });
        });
      }

      setItems(list);
    });

  }, []);

  // ============================================
  // SELECT IMAGE
  // ============================================

  const handleSelectImage = (e) => {

    const file =
      e.target.files[0];

    if (!file) return;

    setSelectedImage(file);

    const imagePreview =
      URL.createObjectURL(file);

    setPreviewImage(imagePreview);

    setImageUrl(file.name);
  };

  // ============================================
  // FIREBASE STORAGE
  // ============================================

  const uploadImageToFirebase = async () => {

    if (!selectedImage) {

      return imageUrl;
    }

    try {

      const imageRef =
        storageRef(
          storage,
          `item_images/${Date.now()}_${selectedImage.name}`
        );

      await uploadBytes(
        imageRef,
        selectedImage
      );

      const downloadURL =
        await getDownloadURL(imageRef);

      return downloadURL;

    } catch (err) {

      console.error(err);

      return imageUrl;
    }
  };

  // ============================================
  // ADD ITEM
  // ============================================

  const handleAddItem = async (e) => {

    e.preventDefault();

    setError('');

    if (
      !name ||
      !description ||
      !price ||
      !stock ||
      !categoryId
    ) {

      setError(
        'Todos los campos excepto imagen son obligatorios.'
      );

      return;
    }

    try {

      setLoading(true);

      const uploadedImage =
        await uploadImageToFirebase();

      const itemsDbRef =
        push(ref(db, 'items'));

      const newItem = {

        id: itemsDbRef.key,

        name: name.trim(),

        description:
          description.trim(),

        price:
          parseFloat(price),

        stock:
          parseInt(stock),

        categoryId,

        available:
          parseInt(stock) > 0,

        imageUrl:
          uploadedImage ||
          'https://i.imgur.com/3NkMCM6.png',

        createdAt:
          Date.now()
      };

      await set(
        itemsDbRef,
        newItem
      );

      // RESET

      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setCategoryId('');
      setImageUrl('');
      setSelectedImage(null);
      setPreviewImage('');

    } catch (err) {

      console.error(err);

      setError(
        'Error al registrar producto.'
      );

    } finally {

      setLoading(false);
    }
  };

  // ============================================
  // TOGGLE
  // ============================================

  const toggleAvailability = async (item) => {

    try {

      const itemRef =
        ref(
          db,
          `items/${item.id}`
        );

      await update(itemRef, {

        available:
          !item.available
      });

    } catch (err) {

      console.error(err);
    }
  };

  // ============================================
  // DELETE
  // ============================================

  const handleDeleteItem = async (item) => {

    const confirmDelete =
      confirm(
        `¿Eliminar "${item.name}"?`
      );

    if (!confirmDelete) return;

    try {

      await remove(
        ref(
          db,
          `items/${item.id}`
        )
      );

    } catch (err) {

      console.error(err);

      alert(
        'Error al eliminar producto.'
      );
    }
  };

  // ============================================
  // OPEN EDIT
  // ============================================

  const openEditModal = (item) => {

    setEditingItem(item);

    setEditName(item.name || '');

    setEditDescription(
      item.description || ''
    );

    setEditPrice(
      item.price || ''
    );

    setEditStock(
      item.stock || ''
    );

    setEditCategoryId(
      item.categoryId || ''
    );

    setEditImageUrl(
      item.imageUrl || ''
    );
  };

  // ============================================
  // UPDATE ITEM
  // ============================================

  const handleUpdateItem = async (e) => {

    e.preventDefault();

    if (!editingItem) return;

    try {

      const itemRef =
        ref(
          db,
          `items/${editingItem.id}`
        );

      await update(itemRef, {

        name:
          editName.trim(),

        description:
          editDescription.trim(),

        price:
          parseFloat(editPrice),

        stock:
          parseInt(editStock),

        categoryId:
          editCategoryId,

        imageUrl:
          editImageUrl.trim(),

        available:
          parseInt(editStock) > 0
      });

      setEditingItem(null);

    } catch (err) {

      console.error(err);

      alert(
        'Error al actualizar producto.'
      );
    }
  };

  // ============================================
  // FILTER
  // ============================================

  const filteredItems =
    items.filter((item) => {

      const category =
        categories.find(
          c => c.id === item.categoryId
        );

      const text =
        `
          ${item.name}
          ${item.description}
          ${category?.name || ''}
        `
          .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  return (

    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <UtensilsCrossed
            className="h-8 w-8"
            style={{
              color: '#4DB6AC'
            }}
          />

          <div>

            <h1 className="text-3xl font-bold font-[Poppins] text-white">

              Gestión de Menú

            </h1>

          </div>

        </div>

        <div className="relative w-full lg:w-80">

          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />

          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="pl-10 bg-[var(--color-card)] border-white/5 text-white"
          />

        </div>

      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* FORM */}

        <Card className="bg-[var(--color-card)] border-white/5 shadow-xl h-fit">

          <CardHeader>

            <CardTitle
              className="flex items-center gap-2 text-lg"
              style={{
                color: '#4DB6AC'
              }}
            >

              <PlusCircle className="h-5 w-5" />

              Nuevo Producto

            </CardTitle>

          </CardHeader>

          <CardContent>

            <form
              onSubmit={handleAddItem}
              className="space-y-4"
            >

              <Input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Nombre"
                className="bg-[var(--color-card-dark)] border-[#4DB6AC]/20 text-white"
              />

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value)
                }
                className="w-full bg-[var(--color-card-dark)] border border-[#4DB6AC]/20 rounded-xl p-3 text-white text-sm"
              >

                <option value="">
                  Seleccionar Categoría
                </option>

                {categories.map((c) => (

                  <option
                    key={c.id}
                    value={c.id}
                  >

                    {c.name}

                  </option>
                ))}

              </select>

              <div className="grid grid-cols-2 gap-3">

                <Input
                  type="number"
                  step="0.1"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  placeholder="Precio"
                  className="bg-[var(--color-card-dark)] border-[#4DB6AC]/20 text-white"
                />

                <Input
                  type="number"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value)
                  }
                  placeholder="Stock"
                  className="bg-[var(--color-card-dark)] border-[#4DB6AC]/20 text-white"
                />

              </div>

              {/* IMAGE */}

              <div className="space-y-3">

                <div className="w-full h-52 rounded-2xl overflow-hidden border border-white/5 bg-[var(--color-card-dark)]">

                  <img
                    src={
                      previewImage ||
                      imageUrl ||
                      'https://i.imgur.com/3NkMCM6.png'
                    }
                    alt="preview"
                    className="w-full h-full object-cover"
                  />

                </div>

                <label className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#4DB6AC]/10 border border-[#4DB6AC]/20 text-[#4DB6AC] font-bold cursor-pointer hover:bg-[#4DB6AC]/20 transition-all">

                  <ImageIcon className="h-4 w-4" />

                  Seleccionar Imagen

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelectImage}
                    className="hidden"
                  />

                </label>

                <Input
                  value={imageUrl}
                  onChange={(e) =>
                    setImageUrl(e.target.value)
                  }
                  placeholder="URL manual o Firebase URL"
                  className="bg-[var(--color-card-dark)] border-[#4DB6AC]/20 text-white"
                />

              </div>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows="4"
                placeholder="Descripción..."
                className="w-full bg-[var(--color-card-dark)] border border-[#4DB6AC]/20 rounded-xl p-3 text-white text-sm"
              />

              {error && (

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-medium">

                  {error}

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
                  : 'Añadir Producto'}

              </Button>

            </form>

          </CardContent>

        </Card>

        {/* PRODUCTS */}

        <div className="xl:col-span-2 space-y-4">

          <div className="flex items-center justify-between">

            <h2 className="text-sm uppercase tracking-widest font-bold text-slate-400">

              Productos Registrados

            </h2>

            <Badge variant="neutral">

              {filteredItems.length} productos

            </Badge>

          </div>

          {filteredItems.length === 0 && (

            <Card className="bg-[var(--color-card)] border-white/5">

              <CardContent className="p-12 text-center space-y-3">

                <Package className="h-14 w-14 text-slate-700 mx-auto" />

                <p className="text-slate-500 text-sm">

                  No existen productos registrados.

                </p>

              </CardContent>

            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {filteredItems.map((item) => {

              const category =
                categories.find(
                  c => c.id === item.categoryId
                );

              return (

                <Card
                  key={item.id}
                  className="bg-[var(--color-card)] border-white/5 overflow-hidden"
                >

                  <div className="relative">

                    <img
                      src={
                        item.imageUrl ||
                        'https://i.imgur.com/3NkMCM6.png'
                      }
                      alt={item.name}
                      className="w-full h-52 object-cover bg-slate-800"
                    />

                    <div className="absolute top-3 right-3">

                      <Badge
                        variant={
                          item.stock > 0
                            ? 'success'
                            : 'danger'
                        }
                      >

                        Stock: {item.stock}

                      </Badge>

                    </div>

                  </div>

                  <CardContent className="p-5 space-y-4">

                    <div className="space-y-1">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h2 className="text-xl font-black text-white">

                          {item.name}

                        </h2>

                        <Badge
                          variant={
                            item.available
                              ? 'success'
                              : 'danger'
                          }
                        >

                          {item.available
                            ? 'Activo'
                            : 'Inactivo'}

                        </Badge>

                      </div>

                      <p className="text-sm text-[#4DB6AC] font-black">

                        S/. {Number(item.price).toFixed(2)}

                      </p>

                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">

                      {item.description}

                    </p>

                    <div className="flex items-center justify-between bg-[var(--color-card-dark)] border border-white/5 rounded-xl px-4 py-3">

                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">

                        Categoría

                      </span>

                      <Badge variant="warning">

                        {category?.name || 'Sin categoría'}

                      </Badge>

                    </div>

                    {item.stock <= 0 && (

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">

                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />

                        <p className="text-[11px] text-amber-300">

                          Este producto no tiene stock disponible.

                        </p>

                      </div>
                    )}

                    {/* ACTIONS */}

                    <div className="flex gap-2 pt-2">

                      {/* VIEW */}

                      <Button
                        onClick={() =>
                          setViewingItem(item)
                        }
                        className="w-full bg-[#4DB6AC]/10 hover:bg-[#4DB6AC]/20 text-[#4DB6AC] border border-[#4DB6AC]/10"
                      >

                        <Eye className="h-4 w-4" />

                      </Button>

                      {/* TOGGLE */}

                      <Button
                        onClick={() =>
                          toggleAvailability(item)
                        }
                        className="w-full bg-[var(--color-card-dark)] hover:bg-slate-800 text-white border border-white/5"
                      >

                        {item.available
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}

                      </Button>

                      {/* EDIT */}

                      <Button
                        onClick={() =>
                          openEditModal(item)
                        }
                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/10"
                      >

                        <Pencil className="h-4 w-4" />

                      </Button>

                      {/* DELETE */}

                      <Button
                        onClick={() =>
                          handleDeleteItem(item)
                        }
                        className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10"
                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                    </div>

                  </CardContent>

                </Card>
              );
            })}

          </div>

        </div>

      </div>

      {/* VIEW MODAL */}

      {viewingItem && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">

          <Card className="w-full max-w-3xl bg-[var(--color-card)] border-white/10 relative overflow-hidden">

            <button
              onClick={() =>
                setViewingItem(null)
              }
              className="absolute top-4 right-4 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition-all"
            >

              <X className="h-5 w-5" />

            </button>

            <div className="relative w-full h-80">

              <img
                src={
                  viewingItem.imageUrl ||
                  'https://i.imgur.com/3NkMCM6.png'
                }
                alt={viewingItem.name}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 p-6 space-y-3">

                <div className="flex items-center gap-2 flex-wrap">

                  <Badge
                    variant={
                      viewingItem.available
                        ? 'success'
                        : 'danger'
                    }
                  >

                    {viewingItem.available
                      ? 'Disponible'
                      : 'No Disponible'}

                  </Badge>

                  <Badge variant="warning">

                    Stock: {viewingItem.stock}

                  </Badge>

                </div>

                <h2 className="text-4xl font-black text-white font-[Poppins]">

                  {viewingItem.name}

                </h2>

                <p className="text-2xl font-black text-[#4DB6AC]">

                  S/. {Number(viewingItem.price).toFixed(2)}

                </p>

              </div>

            </div>

            <CardContent className="p-6 space-y-6">

              <div className="space-y-2">

                <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500">

                  Descripción

                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">

                  {viewingItem.description ||
                    'Sin descripción.'}

                </p>

              </div>

              <div className="flex gap-3 pt-2">

                <Button
                  onClick={() => {

                    setViewingItem(null);

                    openEditModal(viewingItem);
                  }}
                  className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/10"
                >

                  <Pencil className="h-4 w-4 mr-2" />

                  Editar Producto

                </Button>

                <Button
                  onClick={() =>
                    setViewingItem(null)
                  }
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                >

                  Cerrar

                </Button>

              </div>

            </CardContent>

          </Card>

        </div>
      )}

    </div>
  );
}