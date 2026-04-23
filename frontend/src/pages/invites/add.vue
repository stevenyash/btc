<template>
    <main class="main-page" id="">
        <template v-if="pageReady">
            <template v-if="showHeader">
                <section class="page-section q-pa-md" >
                    <div class="container">
                        <div class="row justify-between items-center q-col-gutter-md">
                            <div  v-if="!isSubPage"  class="col-auto " >
                                <q-btn @click="$router.go(-1)"      flat :rounded="false"  size=""  color="primary"  no-caps  unelevated   class="" >
                                    <q-icon name="arrow_back"></q-icon>                             
                                </q-btn>
                            </div>
                            <div  class="col " >
                                <div class=" text-h6 text-primary" >
                                    Add New Invite
                                </div>
                            </div>
                            <!--topcardactiontemplates-->
                        </div>
                    </div>
                </section>
            </template>
            <section class="page-section " >
                <div class="container">
                    <div class="row q-col-gutter-x-md">
                        <div  class="col-md-9 col-12 comp-grid" >
                            <div >
                                <q-form ref="observer" @submit.prevent="submitForm()">
                                <q-card  :flat="isSubPage" class="q-pa-md nice-shadow-6">
                                    <div class="row q-col-gutter-x-md">
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Invitee Email 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <check-duplicate error-msg="Not available" v-model="formData.invitee_email" check-path="components_data/invites_invitee_email_exist/" v-slot="checker">
                                                    <q-input   ref="ctrlinvitee_email" @blur="checker.check" :loading="checker.loading" v-model.trim="formData.invitee_email"  label="Invitee Email" type="email" placeholder="Enter Invitee Email"      
                                                    class="" :error="isFieldValid('invitee_email') || checker.alreadyExist" :error-message="getFieldError('invitee_email') || checker.errorMsg">
                                                    </q-input>
                                                    </check-duplicate>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Invitee Phone 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <check-duplicate error-msg="Not available" v-model="formData.invitee_phone" check-path="components_data/invites_invitee_phone_exist/" v-slot="checker">
                                                    <q-input   ref="ctrlinvitee_phone" @blur="checker.check" :loading="checker.loading" v-model.trim="formData.invitee_phone"  label="Invitee Phone" type="text" placeholder="Enter Invitee Phone"      
                                                    class="" :error="isFieldValid('invitee_phone') || checker.alreadyExist" :error-message="getFieldError('invitee_phone') || checker.errorMsg">
                                                    </q-input>
                                                    </check-duplicate>
                                                </div>
                                            </div>
                                        </div>
                                        <input name="ctrlreferral_code"  ref="ctrlreferral_code" v-model="formData.referral_code" type="hidden" />
                                    </div>
                                    <div v-if="showSubmitButton" class="text-center q-my-md">
                                        <q-btn type="submit"    :rounded="false"  color="primary"  no-caps  unelevated    icon-right="send" :loading="saving">
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                            </template>
                                        </q-btn>
                                    </div>
                                </q-card>
                                </q-form>
                                <slot :submit="submitForm" :saving="saving"></slot>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </template>
    </main>
</template>
<script setup>
    import {  computed, ref, reactive, toRefs, onMounted } from 'vue';
    import { required, email, } from 'src/services/validators';
    import { usePageStore } from 'src/stores/page';
    import { useMeta } from 'quasar';
    import { useApp } from 'src/composables/app';
    import { useAddPage } from 'src/composables/addpage';
    //[--PAGE-IMPORT-STATEMENT--]
    const props = defineProps({
        pageName : {
            type : String,
            default : 'invites',
        },
        pageStoreKey: {
            type: String,
            default: 'INVITES',
        },
        routeName : {
            type : String,
            default : 'invitesadd',
        },
        apiPath : {
            type : String,
            default : 'invites/add',
        },
        submitButtonLabel: {
            type: String,
            default: "Submit",
        },
        formValidationError: {
            type: String,
            default: "Form is invalid",
        },
        formValidationMsg: {
            type: String,
            default: "Please complete the form",
        },
        msgTitle: {
            type: String,
            default: "Create Record",
        },
        msgAfterSave: {
            type: String,
            default: "Record added successfully",
        },
        msgBeforeSave: {
            type: String,
            default: "",
        },
        showHeader: {
            type: Boolean,
            default: true,
        },
        showSubmitButton: {
            type: Boolean,
            default: true,
        },
        redirect: {
            type : Boolean,
            default : true,
        },
        isSubPage: {
            type : Boolean,
            default : false,
        },
        pageData: { // use to set formData default values from another page
            type: Object,
            default: () => ({
                invitee_email: " ", invitee_phone: "254", referral_code: "", 
            })
        },
    });
    const store = usePageStore(props.pageStoreKey);
    const app = useApp();// application state and methods
    const formData = reactive({ ...props.pageData });
    //vuelidate form validation rules
    const rules = computed(() => {
        return {
            invitee_email: { email }
        }
    });
    const page = useAddPage({ store, props, formData, rules, beforeSubmit, afterSubmit });// page form hook
    //event raised before form submit
    //event raised before form submit
   function beforeSubmit() {
    // Check if both email and phone are empty
    if (!formData.invitee_email && !formData.invitee_phone) {
        alert("Please fill in either the email or phone field.");
        return false; // Prevent form submission
    }
    // If at least one field is filled, allow form submission
    return true;
}
    //event raised after form submit
    function afterSubmit(response) {
        app.flashMsg(props.msgTitle, props.msgAfterSave);
        page.setFormDefaultValues(); // reset form data
        if(app.isDialogOpen()){
            app.closeDialogs(); // if page is open as dialog, close dialog
        }
        else if(props.redirect){
            app.navigateTo(`/invites`);
        }
    }
    const {  saving, pageReady,   } = toRefs(page.state);
    const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;
    useMeta(() => {
        return {
            //set browser title
            title: "Add New Invite"
        }
    });
    onMounted(()=>{ 
    });
    // expose page object for other components access
    defineExpose({
        page
    });

</script>

<style scoped>

</style>
<style scoped>

</style>
