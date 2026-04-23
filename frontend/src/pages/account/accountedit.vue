<template>
    <main class="main-page" id="">
        <template v-if="pageReady">
            <section class="page-section " >
                <div class="container">
                    <div class="row q-col-gutter-x-md">
                        <div  class="col-md-9 col-12 comp-grid" >
                            <div >
                                <q-card  :flat="isSubPage" class="q-pa-md nice-shadow-6">
                                    <q-form ref="observer"  @submit.prevent="submitForm()">
                                    <!--[form-content-start]-->
                                    <div class="row q-col-gutter-x-md">
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Image
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <div class="q-mb-sm">
                                                        <q-uploader-input show-uploaded-files :max-files="1" :max-file-size="3" accept=".jpg,.png,.gif,.jpeg" :multiple="false" delete-icon="clear" style="width:100%" label="Choose files or drop files here" upload-path="fileuploader/upload/image" v-model="formData.image"  ></q-uploader-input>
                                                        <!-- <small class="q-pa-sm text-negative"></small> -->
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Phone
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlphone" v-model.trim="formData.phone"  label="Phone" type="text" placeholder="Enter Phone"
                                                    class="" :error="isFieldValid('phone')" :error-message="getFieldError('phone')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Username
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlusername" v-model.trim="formData.username"  label="Username" type="text" placeholder="Enter Username"
                                                    class="" :error="isFieldValid('username')" :error-message="getFieldError('username')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12" v-if="isSuperAdmin">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Status *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlstatus" v-model.trim="formData.status"  label="Status" type="number" placeholder="Enter Status"   step="any"
                                                    class="" :error="isFieldValid('status')" :error-message="getFieldError('status')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Subscription Code *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlsubscription_code" v-model.trim="formData.subscription_code"  label="Subscription Code" type="text" placeholder="Enter Subscription Code"
                                                    class="" :error="isFieldValid('subscription_code')" :error-message="getFieldError('subscription_code')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12" v-if="isSuperAdmin">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    User Role Id
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source @loaded="response => mapOptionField(response, 'user_role_id')"  api-path="components_data/role_id_option_list"  v-slot="req">
                                                        <nice-select     :loading="req.loading"   ref="ctrluser_role_id" v-model="formData.user_role_id" :options="req.response" label="User Role Id"  :error="isFieldValid('user_role_id')" :error-message="getFieldError('user_role_id')">
                                                        </nice-select>
                                                    </api-data-source>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Nhif
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlnhif" v-model.trim="formData.nhif"  label="Nhif" type="text" placeholder="Enter Nhif"
                                                    class="" :error="isFieldValid('nhif')" :error-message="getFieldError('nhif')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Nssf
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlnssf" v-model.trim="formData.nssf"  label="Nssf" type="text" placeholder="Enter Nssf"
                                                    class="" :error="isFieldValid('nssf')" :error-message="getFieldError('nssf')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    National Id
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlnational_id" v-model.trim="formData.national_id"  label="National Id" type="text" placeholder="Enter National Id"
                                                    class="" :error="isFieldValid('national_id')" :error-message="getFieldError('national_id')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    usercode
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlusercode" v-model="formData.usercode"  label="usercode" :type="isPwd ? 'usercode' : 'text'" placeholder="Enter usercode"
                                                    class="" :error="isFieldValid('usercode')" :error-message="getFieldError('usercode')">
                                                    <template v-slot:append>
                                                        <q-icon
                                                        :name="isPwd ? 'visibility_off' : 'visibility'"
                                                        class="cursor-pointer"
                                                        @click="isPwd = !isPwd"
                                                        />
                                                    </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Confirm usercode
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrlconfirmusercode" v-model="formData.confirm_usercode" :type="isCPwd ? 'usercode' : 'text'" label="Confirm usercode" placeholder="Confirm usercode"  :error="isFieldValid('confirm_usercode')" :error-message="getFieldError('confirm_usercode')">
                                                    <template v-slot:append>
                                                        <q-icon
                                                        :name="isCPwd ? 'visibility_off' : 'visibility'"
                                                        class="cursor-pointer"
                                                        @click="isCPwd = !isCPwd"
                                                        />
                                                    </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Email
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlemail" v-model.trim="formData.email"  label="Email" type="email" placeholder="Enter Email"
                                                    class="" :error="isFieldValid('email')" :error-message="getFieldError('email')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Referred By
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlreferred_by" v-model.trim="formData.referred_by"  label="Referred By" type="text" placeholder="Enter Referred By"
                                                    class="" :error="isFieldValid('referred_by')" :error-message="getFieldError('referred_by')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!--[form-content-end]-->
                                    <div v-if="showSubmitButton" class="text-center q-my-md">
                                        <q-btn    :rounded="false"  color="primary"  no-caps  unelevated   type="submit" icon-right="send" :loading="saving">
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                            </template>
                                        </q-btn>
                                    </div>
                                    </q-form>
                                    <slot :submit="submitForm" :saving="saving"></slot>
                                </q-card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </template>
        <template v-if="loading">
            <div style="min-height:200px" class="q-pa-sm text-center relative-position">
                <q-inner-loading color="primary" label="Loading..." showing></q-inner-loading>
            </div>
        </template>
    </main>
</template>
<script setup>
	import {  computed, ref, reactive, toRefs, onMounted } from 'vue';
	import { required, email, sameAs, numeric, } from 'src/services/validators';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useAuth } from 'src/composables/auth';
	import { useEditPage } from 'src/composables/editpage';
	import { usePageStore } from 'src/stores/page';

	const props = defineProps({
		id: [String, Number],
		pageName: {
			type: String,
			default: 'users',
		},
		pageStoreKey: {
			type: String,
			default: 'ACCOUNT',
		},
		routeName: {
			type: String,
			default: 'usersaccountedit',
		},
		pagePath: {
			type : String,
			default : 'account/edit',
		},
		apiPath: {
			type: String,
			default: 'account/edit',
		},
		submitButtonLabel: {
			type: String,
			default: "Update",
		},
		msgTitle: {
			type: String,
			default: "Update Record",
		},
		msgBeforeSave: {
			type: String,
			default: "",
		},
		msgAfterSave: {
			type: String,
			default: "Record updated successfully",
		},
		formValidationError: {
			type: String,
			default: "Form is invalid",
		},
		formValidationMsg: {
			type: String,
			default: "Please complete the form",
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
	});

	const store = usePageStore(props.pageStoreKey);
	const app = useApp();
	const auth = useAuth();

	// Check if user is superadmin
	const isSuperAdmin = computed(() => {
		return auth.userRole?.toLowerCase() === 'superadmin';
	});

	const formDefaultValues = Object.assign({
		image: "", phone: "NULL", username: "NULL", status: "", subscription_code: "", user_role_id: "", nhif: "NULL", nssf: "NULL", national_id: "NULL", usercode: "NULL", confirm_usercode: "", email: "NULL", referred_by: "NULL",
	}, props.pageData);

	const formData = reactive({ ...formDefaultValues });

	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		location.reload();
	}

	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			status: { required, numeric },
		subscription_code: { required },
		confirm_usercode: { sameAs: sameAs(formData.usercode, 'usercode') },
		email: { email }
		}
	});

	const page = useEditPage({ store, props, formData, rules, afterSubmit });

	const {  saving, loading, pageReady, isPwd, isCPwd, } = toRefs(page.state);

	const {  currentRecord: editRecord } = toRefs(store.state);

	const { load, submitForm, isFieldValid, getFieldError, mapOptionField, } = page.methods;

	useMeta(() => {
		return {
			//set browser title
			title: "My Account"
		}
	});


	onMounted(()=>{
	});

</script>

<style scoped>

</style>
