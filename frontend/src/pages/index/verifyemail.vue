<template>
    <div class="container">
        <div class="row justify-center">
            <div class="col-md-6 col-12">
                <transition appear enter-active-class="animated bounceIn" leave-active-class="animated fadeOut" >
					<q-banner dense inline-actions rounded class="bg-red-1 q-mt-lg" v-if="errorMsg">
						<template v-slot:avatar>
							<q-icon color="red" name="error" />
						</template>
						{{ errorMsg.toString() }}
						<template v-slot:action>
							<q-btn @click="errorMsg = null" dense flat icon="close" />
						</template>
					</q-banner>
				</transition>
				<q-card  flat bordered class="q-my-lg text-center">
                    <q-card-section>
                        <div class="text-h5 text-bold text-positive"> 
							<q-icon size="lg" name="check_circle"></q-icon> 
							{{sentMsg}}
						</div>
						<div class="text-caption">
							Please verify your email address by following the link in your mailbox
						</div>
                       	<q-separator class="q-my-md" />
						   <div class="text-center">
								<q-btn @click="resend()" flat color="primary" no-caps :loading="loading">
									<q-icon name="email"></q-icon> Resend Email
									<template v-slot:loading>
											<q-spinner-oval />
										</template>
								</q-btn>
						   </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </div>
</template>

<script>
	export default {
		props: {},
		data: function () {
			return {
				loading: false,
				sentMsg: "Email verification link sent to your mailbox",
				errorMsg: null
			};
		},
		methods: {
			resend(){
				let url = "auth/resendverifyemail";
				this.loading = true;
				this.errorMsg = null;
				let formData = {
					token:  this.$route.query.token
				}
				this.$api.post(url, formData).then((response) => {
					this.loading = false;
					this.sentMsg = response.data;
				},
				(request) => {
					this.loading = false;
					this.errorMsg = request?.response?.data || "Unable to complete request";
				});
			}
		},
	};
</script>
