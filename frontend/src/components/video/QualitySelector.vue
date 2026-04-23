<template>
  <div class="quality-selector">
    <q-btn
      flat
      dense
      :label="currentQualityLabel"
      icon="high_quality"
      @click="showMenu = !showMenu"
    />
    <q-menu v-model="showMenu">
      <q-list dense>
        <q-item
          v-for="source in availableSources"
          :key="source.quality"
          clickable
          @click="$emit('switch-quality', source)"
          :active="currentQuality === source.quality"
        >
          <q-item-section>
            <q-item-label>{{ source.label }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="check" v-if="currentQuality === source.quality" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  showMenu: {
    type: Boolean,
    required: true
  },
  currentQualityLabel: {
    type: String,
    required: true
  },
  availableSources: {
    type: Array,
    required: true
  },
  currentQuality: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:showMenu', 'switch-quality']);

const showMenu = computed({
  get: () => props.showMenu,
  set: (value) => emit('update:showMenu', value)
});
</script>

<style scoped>
.quality-selector {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}
</style>
