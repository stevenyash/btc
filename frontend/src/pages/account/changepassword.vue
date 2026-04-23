<template>
    <div class="container change-usercode-container">
        <div class="row justify-center">
            <div class="col-md-10 col-10">
                <div class="text-h5 text-bold q-mb-md text-primary">
                    Change usercode
                </div>

                <q-form ref="observer" @submit.prevent="submitForm()">
                    <q-input
                        filled
                        label="Current usercode"
                        placeholder="Enter current usercode"
                        v-model="formData.oldusercode"
                        :type="showCurrentusercode ? 'text' : 'usercode'"
                        :error="isFieldValid('oldusercode')"
                        :error-message="getFieldError('oldusercode')"
                        :rules="[
                            (val) => !!val || 'Current usercode is required',
                            (val) => val.length >= 4 || 'Minimum 4 characters',
                        ]"
                    >
                        <template v-slot:append>
                            <q-icon
                                :name="
                                    showCurrentusercode
                                        ? 'visibility_off'
                                        : 'visibility'
                                "
                                class="cursor-pointer"
                                @click="
                                    showCurrentusercode = !showCurrentusercode
                                "
                            />
                        </template>
                    </q-input>

                    <q-input
                        filled
                        class="q-mt-md"
                        label="New usercode"
                        placeholder="Enter new usercode"
                        v-model="formData.newusercode"
                        :type="showNewusercode ? 'text' : 'usercode'"
                        :error="isFieldValid('newusercode')"
                        :error-message="getFieldError('newusercode')"
                        :rules="[
                            (val) => !!val || 'New usercode is required',
                            (val) => val.length >= 8 || 'Minimum 8 characters',
                            (val) =>
                                /[A-Z]/.test(val) ||
                                'At least one uppercase letter',
                            (val) =>
                                /[a-z]/.test(val) ||
                                'At least one lowercase letter',
                            (val) => /[0-9]/.test(val) || 'At least one number',
                            (val) =>
                                val !== formData.oldusercode ||
                                'New usercode must be different from current',
                        ]"
                        @blur="validateusercodeStrength"
                    >
                        <template v-slot:append>
                            <q-icon
                                :name="
                                    showNewusercode
                                        ? 'visibility_off'
                                        : 'visibility'
                                "
                                class="cursor-pointer"
                                @click="showNewusercode = !showNewusercode"
                            />
                        </template>
                    </q-input>

                    <q-input
                        filled
                        class="q-mt-md"
                        label="Confirm New usercode"
                        placeholder="Confirm new usercode"
                        v-model="formData.confirmusercode"
                        :type="showConfirmusercode ? 'text' : 'usercode'"
                        :error="isFieldValid('confirmusercode')"
                        :error-message="getFieldError('confirmusercode')"
                        :rules="[
                            (val) => !!val || 'Please confirm your usercode',
                            (val) =>
                                val === formData.newusercode ||
                                'usercodes do not match',
                        ]"
                    >
                        <template v-slot:append>
                            <q-icon
                                :name="
                                    showConfirmusercode
                                        ? 'visibility_off'
                                        : 'visibility'
                                "
                                class="cursor-pointer"
                                @click="
                                    showConfirmusercode = !showConfirmusercode
                                "
                            />
                        </template>
                    </q-input>

                    <div class="q-mt-lg text-center">
                        <q-btn
                            unelevated
                            type="submit"
                            icon="lock_reset"
                            color="primary"
                            size="lg"
                            :loading="saving"
                            :disable="!formValid"
                        >
                            Update usercode
                            <template v-slot:loading>
                                <q-spinner-oval />
                            </template>
                        </q-btn>
                    </div>
                </q-form>
                <div class="usercode-hint q-mt-md q-pa-lg">
                    <p>usercode must contain:</p>
                    <ul>
                        <li>At least 8 characters</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>Must be different from current usercode</li>
                    </ul>
                    <usercodeStrengthMeter :usercode="formData.newusercode" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { required, sameAs } from "@vuelidate/validators";
import { useApp } from "src/composables/app";
import { useForm } from "src/composables/formpage";
import usercodeStrengthMeter from "src/components/usercodeStrengthMeter.vue";
const props = defineProps({
    pageName: {
        type: String,
        default: "changeusercode",
    },
    apiPath: {
        type: String,
        default: "account/changeusercode",
    },
    formValidationError: {
        type: String,
        default: "Form is invalid",
    },
    formValidationMsg: {
        type: String,
        default: "Please complete the form",
    },
});

const app = useApp();

// Form data
const formData = reactive({
    oldusercode: "",
    newusercode: "",
    confirmusercode: "",
});

// usercode visibility toggles
const showCurrentusercode = ref(false);
const showNewusercode = ref(false);
const showConfirmusercode = ref(false);

// Initialize form composable
const {
    saving,
    pageReady,
    submitForm, // Directly destructure submitForm
    isFieldValid, // Directly destructure isFieldValid
    getFieldError, // Directly destructure getFieldError
} = useForm({
    props,
    formData,
    rules: computed(() => ({
        oldusercode: {
            required,
        },
        newusercode: {
            required,
            minLength: (value) => value.length >= 8 || "Minimum 8 characters",
            containsUppercase: (value) =>
                /[A-Z]/.test(value) || "At least one uppercase letter",
            containsLowercase: (value) =>
                /[a-z]/.test(value) || "At least one lowercase letter",
            containsNumber: (value) =>
                /[0-9]/.test(value) || "At least one number",
            notSameAs: (value) =>
                value !== formData.oldusercode ||
                "New usercode must be different from current",
        },
        confirmusercode: {
            required,
            sameAs: sameAs(formData.newusercode),
        },
    })),
    afterSubmit: (response) => {
        app.flashMsg("usercode changed successfully");
        // Reset form data and visibility
        Object.assign(formData, {
            oldusercode: "",
            newusercode: "",
            confirmusercode: "",
        });
        showCurrentusercode.value = false;
        showNewusercode.value = false;
        showConfirmusercode.value = false;
    },
});

// Form validation state
const formValid = computed(() => {
    return (
        formData.oldusercode &&
        formData.newusercode &&
        formData.confirmusercode &&
        formData.newusercode === formData.confirmusercode &&
        formData.newusercode.length >= 8 &&
        /[A-Z]/.test(formData.newusercode) &&
        /[a-z]/.test(formData.newusercode) &&
        /[0-9]/.test(formData.newusercode) &&
        formData.newusercode !== formData.oldusercode
    );
});
</script>
<style scoped>
.change-usercode-container {
    background-color: #f8f9fa;
    min-height: 300px;
    padding: 20px 0;
}

.q-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 24px;
}

.text-h5 {
    margin-bottom: 20px;
    font-weight: 600;
}

.q-input {
    margin-bottom: 20px;
}

.q-field__control {
    min-height: 56px; /* Consistent height */
}

.usercode-hint {
    font-size: 0.75rem;
    color: #6c757d;
    margin: -12px 0 16px 0;
}

.usercode-hint ul {
    margin: 4px 0 0 0;
    padding-left: 20px;
}

.q-btn--large {
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 500;
}

.q-spinner-oval {
    height: 20px;
    width: 20px;
    border-width: 2px;
}
</style>
