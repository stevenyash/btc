<template>
    <div class="container">
        <div class="row justify-center">
            <div class="col col-md-6">
                <transition appear enter-active-class="animated bounceIn" leave-active-class="animated fadeOut" >
					<q-banner dense inline-actions rounded class="bg-red-1 q-mt-lg" v-if="errorMsg">
						<template v-slot:avatar>
							<q-icon color="red" name="error" />
						</template>
						{{ errorMsg.toString() }}
						<template v-slot:action>
							<q-btn @click="errorMsg = ''" dense flat icon="close" />
						</template>
					</q-banner>
				</transition>
				<q-card flat bordered class="q-my-lg">
                    <q-card-section>
                        <div class="q-my-md">
                            <div class="text-h5 text-bold">usercode Reset </div>
                            <small class="text-caption">
                                Please provide the valid email address you used to register
                            </small>
                        </div>
						<q-banner v-if="sentMsg" inline-actions rounded class="bg-green-1 q-my-lg">
							<template v-slot:avatar>
								<q-icon color="positive" name="email" />
							</template>
							<div class="text-bold">{{ sentMsg }}</div>
						</q-banner>
						 <q-form ref="observer" @submit.prevent="sendEmail()">
							<div class="row q-col-gutter-lg">
								<div class="col-md-9 col">
									<q-input
										v-model="formData.email"
										outlined
										required
										dense
										placeholder="Email"
										type="email"
									/>
								</div>
								<div class="col-md-3 col-sm-4">
									<q-btn color="primary" unelevated no-caps type="submit" :loading="saving">
										Send <q-icon name="email"></q-icon>
										<template v-slot:loading>
											<q-spinner-oval />
										</template>
									</q-btn>
								</div>

							</div>
						 </q-form>
                        <br />
                        <div class="text-info">
                            A link will be sent to your email containing the information you need for your usercode
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data: function () {
        return {
			formData: {
				email: ""
			},
			saving:false,
			errorMsg:null,
			sentMsg: null,
        };
    },
    methods: {
		async sendEmail(){
			this.saving = true;
			this.errorMsg = null;
			this.$api.post("auth/forgotusercode", this.formData).then( (response) => {
				this.saving = false;
				this.sentMsg = response.data;
			},
			(request) => {
				this.saving = false;
				this.sentMsg = null;
				this.errorMsg = request?.response?.data || "Unable to complete request";
			});
		},
	},
};
</script>