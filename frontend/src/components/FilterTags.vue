<template>
    <template v-for="(filter, key) in filters" :key="key">
        <q-card v-if="filterHasValue(filter)" :class="tagClass">
            {{ filter.tag || key }}

            <q-chip :color="chipColor" :text-color="chipTextColor" v-if="isMultipleFilter(filter)"
                v-for="val in filter.value" :key="`filtertag-${val}`" :class="chipClass" removable
                @remove="removeFilter(filter, val)" :label="getFilterLabel(filter, val)" />

            <q-chip :color="chipColor" :text-color="chipTextColor" v-else :class="chipClass" removable
                @remove="removeFilter(filter)" :label="getFilterLabel(filter)" />
        </q-card>
    </template>
</template>

<script setup>
const props = defineProps({
    controller: {
        type: Object,
        default: () => { }
    },
    chipClass: {
        type: String,
        default: 'bg-primary font-medium text-white',
    },
    tagClass: {
        type: String,
        default: 'q-pa-sm q-mb-sm',
    },
    chipColor: {
        type: String,
        default: 'primary',
    },
    chipTextColor: {
        type: String,
        default: 'text-white',
    }
});
function isMultipleFilter(filter) {
    return (filter.valueType === 'multiple' || filter.valueType === 'multiple-date');
}

const { filterHasValue, getFilterLabel, removeFilter, filters } = props.controller
</script>