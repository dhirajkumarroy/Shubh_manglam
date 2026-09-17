import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';
import { adminCategoryService, CategoryItem } from '../services/category.service';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [icon, setIcon] = useState<string>('🎪');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminCategoryService.listCategories({
        search: search.trim() || undefined,
        limit: 100,
      });
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setIcon('🎪');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || '🎪');
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCat) {
        await adminCategoryService.updateCategory(editingCat.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          sortOrder,
          isActive,
        });
      } else {
        await adminCategoryService.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          sortOrder,
          isActive,
        });
      }

      setShowModal(false);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`Are you sure you want to remove or deactivate '${cat.name}'?`)) return;
    try {
      const res = await adminCategoryService.deleteCategory(cat.id);
      alert(res.message || 'Action completed');
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to remove category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight">Marketplace Categories</h2>
          <p className="text-sm text-[#78716C] mt-1">
            Dynamic service categories loaded from PostgreSQL. Changes immediately propagate across Customer and Provider mobile apps.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCategories}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#57534E] bg-white border border-[#E7E0D8] hover:bg-[#F5EFE6] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-[#E7E0D8] shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCategories();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search category name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-[#E7E0D8] bg-[#FAF8F5] focus:outline-none focus:border-primary text-[#1C1917]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-secondary hover:bg-secondary-dark transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Grid of Categories */}
      {loading ? (
        <div className="p-16 text-center text-[#78716C]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
          <p className="font-semibold text-xs">Loading database categories...</p>
        </div>
      ) : error ? (
        <div className="p-16 text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
          <p className="font-bold text-xs">{error}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-16 text-center text-[#78716C]">
          <Tag className="w-10 h-10 mx-auto text-[#A8A29E] mb-2" />
          <p className="text-sm font-bold text-[#1C1917]">No Categories Found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl p-5 border transition shadow-sm flex flex-col justify-between ${
                cat.isActive ? 'border-[#E7E0D8]' : 'border-neutral-300 opacity-60 bg-neutral-50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{cat.icon || '🎪'}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#1C1917]">{cat.name}</h4>
                      <p className="text-[10px] text-[#78716C]">slug: {cat.slug}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cat.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-[#57534E] mt-3 line-clamp-2">
                  {cat.description || 'No description provided'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E7E0D8] flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-[#78716C]">
                  {cat.vendorCount} Vendors • Order #{cat.sortOrder}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-[#57534E] hover:bg-[#F5EFE6] hover:text-[#1C1917] transition"
                    title="Edit Category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                    title="Remove or Deactivate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create or Edit Category */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <h3 className="text-base font-black text-[#1C1917]">
              {editingCat ? 'Edit Category' : 'Add New Category'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Drone Videography"
                className="w-full px-3 py-2 text-xs border border-[#E7E0D8] rounded-xl text-[#1C1917] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Icon / Emoji
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🚁"
                  className="w-full px-3 py-2 text-xs border border-[#E7E0D8] rounded-xl text-[#1C1917] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-[#E7E0D8] rounded-xl text-[#1C1917] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aerial 4K coverage of weddings and celebrations"
                className="w-full px-3 py-2 text-xs border border-[#E7E0D8] rounded-xl text-[#1C1917] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-[#E7E0D8] text-primary focus:ring-0"
              />
              <label htmlFor="isActiveCheckbox" className="text-xs font-semibold text-[#1C1917]">
                Active (Visible to Providers & Customers)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#F5EFE6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark"
              >
                {submitting ? 'Saving...' : editingCat ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
