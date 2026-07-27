<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const products = ref<any[]>([]);
const loading = ref(true);
const showAdd = ref(false);
const editProduct = ref<any>(null);
const saving = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<any>(null);
const deleting = ref(false);

const formName = ref("");
const formDesc = ref("");
const formPrice = ref(0);
const formEnabled = ref(true);

const columns = [
  { accessorKey: "name", header: "名称" },
  { accessorKey: "description", header: "描述" },
  {
    accessorKey: "price",
    header: "价格",
    cell: ({ row }: any) => formatUsdtLabel(row.original.price),
  },
  {
    accessorKey: "enabled",
    header: "状态",
    cell: ({ row }: any) => (row.original.enabled ? "启用" : "禁用"),
  },
  { id: "actions", header: "操作" },
];

async function fetch() {
  loading.value = true;
  try {
    const data = await $fetch("/api/products", { query: { limit: 100 } });
    products.value = (data as any).items || [];
  } catch {}
  loading.value = false;
}

function getFormData() {
  return {
    name: formName.value,
    description: formDesc.value,
    price: parseUsdt(formPrice.value),
    enabled: formEnabled.value,
  };
}

async function addProduct() {
  saving.value = true;
  try {
    await $fetch("/api/admin/products", {
      method: "POST",
      body: getFormData(),
    });
    toast.add({ title: "创建成功", color: "success" });
    closeModal();
    await fetch();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "创建失败", color: "error" });
  } finally {
    saving.value = false;
  }
}

async function updateProduct() {
  if (!editProduct.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/admin/products/${editProduct.value.id}`, {
      method: "PATCH",
      body: getFormData(),
    });
    toast.add({ title: "更新成功", color: "success" });
    closeModal();
    await fetch();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "更新失败", color: "error" });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(product: any) {
  deleteTarget.value = product;
  showDeleteConfirm.value = true;
}

async function deleteProduct() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/products/${deleteTarget.value.id}`, { method: "DELETE" });
    toast.add({ title: "删除成功", color: "success" });
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
    await fetch();
  } catch (error: any) {
    toast.add({ title: error.data?.message || "删除失败", color: "error" });
  } finally {
    deleting.value = false;
  }
}

function openAdd() {
  editProduct.value = null;
  resetForm();
  showAdd.value = true;
}

function openEdit(product: any) {
  editProduct.value = product;
  formName.value = product.name;
  formDesc.value = product.description;
  formPrice.value = toUsdt(product.price);
  formEnabled.value = product.enabled;
  showAdd.value = true;
}

function closeModal() {
  showAdd.value = false;
  editProduct.value = null;
  resetForm();
}

function resetForm() {
  formName.value = "";
  formDesc.value = "";
  formPrice.value = 0;
  formEnabled.value = true;
}

onMounted(fetch);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="商品管理">
        <template #right>
          <UButton @click="openAdd">添加商品</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UTable v-if="!loading && products.length > 0" :data="products" :columns="columns">
          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton size="xs" @click="openEdit(row.original)">编辑</UButton>
              <UButton
                size="xs"
                color="error"
                variant="outline"
                @click="confirmDelete(row.original)"
                >删除</UButton
              >
            </div>
          </template>
        </UTable>

        <TableState
          v-else
          :loading="loading"
          empty-message="暂无商品"
          skeleton-class="h-12 w-full"
        />
      </div>
    </template>
  </UDashboardPanel>

  <ModalsProductFormModal
    v-model:open="showAdd"
    :edit-product="editProduct"
    v-model:form-name="formName"
    v-model:form-desc="formDesc"
    v-model:form-price="formPrice"
    v-model:form-enabled="formEnabled"
    :saving="saving"
    @save="editProduct ? updateProduct() : addProduct()"
    @close="closeModal"
  />

  <ModalsConfirmModal
    v-model:open="showDeleteConfirm"
    title="确认删除"
    :message="`确定要删除「${deleteTarget?.name}」吗？此操作不可撤销。`"
    confirm-text="确认删除"
    confirm-color="error"
    :loading="deleting"
    @confirm="deleteProduct"
    @close="showDeleteConfirm = false"
  />
</template>
