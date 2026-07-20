<script setup lang="ts">
defineProps<{
  editProduct?: any;
  formName: string;
  formDesc: string;
  formPrice: number;
  formEnabled: boolean;
}>();

defineEmits<{
  (e: "update:formName", value: string): void;
  (e: "update:formDesc", value: string): void;
  (e: "update:formPrice", value: number): void;
  (e: "update:formEnabled", value: boolean): void;
  (e: "save"): void;
  (e: "close"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" :title="editProduct ? '编辑商品' : '添加商品'">
    <template #body>
      <div class="space-y-4">
        <UFormField label="名称">
          <UInput
            :value="formName"
            @update:value="$emit('update:formName', $event)"
            placeholder="商品名称"
            class="w-full"
          />
        </UFormField>
        <UFormField label="描述">
          <UTextarea
            :value="formDesc"
            @update:value="$emit('update:formDesc', $event)"
            placeholder="商品描述"
            class="w-full"
          />
        </UFormField>
        <UFormField label="价格 (USDT)">
          <UInput
            :value="formPrice"
            @update:value="$emit('update:formPrice', Number($event))"
            type="number"
            step="0.000001"
            class="w-full"
          />
        </UFormField>
        <UFormField label="启用">
          <UCheckbox :checked="formEnabled" @update:checked="$emit('update:formEnabled', $event)" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="$emit('close')">取消</UButton>
        <UButton @click="$emit('save')">{{ editProduct ? "保存" : "添加" }}</UButton>
      </div>
    </template>
  </UModal>
</template>
