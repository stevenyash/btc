<template>
    <div class="container">
        <div class="row justify-center">
            <div class="col-md-5 col-12">
                <q-card class="q-my-lg no-shadow">
					<q-card-section>
						<q-banner>
							<template v-slot:avatar>
								<q-icon color="positive" size="40px" name="check_circle"></q-icon>
							</template>
							<div class="row justify-between q-col-gutter-md">
								<div class="col">
									<div class="text-h6 text-bold">OTP Verification</div>
								</div>
								<div class="col-auto">
									<div class="text-h6 text-bold text-info">{{ countDown }}</div>
								</div>
							</div>
							<div class="text-body2 text-grey-6">OTP has been sent to your email</div>
						</q-banner>
						<q-form ref="observer" @submit.prevent="startOtpValidation()" >
							<div class="row justify-between q-col-gutter-md">
								<div class="col">
									<q-input dense class="text-center" outlined placeholder="Enter OTP" v-model="otpCode" required="required" type="text" input-class="text-center text-left otp-input" />
								</div>
								<div class="col-auto">
									<q-btn unelevated :loading="loading" color="positive" no-caps type="submit">
											Verify
									</q-btn>
								</div>
							</div>
							<transition appear enter-active-class="animated bounceIn" leave-active-class="animated fadeOut" >
								<q-banner dense inline-actions rounded class="bg-red-1" v-if="errorMsg">
									<template v-slot:avatar>
										<q-icon color="red" name="error" />
									</template>
									{{ errorMsg.toString() }}
									<template v-slot:action>
										<q-btn @click="errorMsg = null" dense flat icon="close" />
									</template>
								</q-banner>
							</transition>
							<div class="row justify-between q-col-gutter-md q-mt-xs">
								<div class="col">
									<span class="text-grey">Didn't receive OTP</span> ? 
								</div>
								<div class="col-auto">
									<q-btn unelevated color="blue-1"  text-color="blue" :disabled="!canResend" :loading="resending" @click="resendOtp()" no-caps type="button">
										Resend...
									</q-btn>
								</div>
							</div>
						</q-form>
					</q-card-section>
                </q-card>
            </div>
        </div>
    </div>
</template>
<script>
import { useAuthStore } from 'src/stores/auth';
export default {
    setup() {
			const store = useAuthStore()
			return { store }
		},
	data: function () {
        return {
			otpCode: '',
            loading: false,
            resending: false,
            canResend: false,
            errorMsg: '',
            countDown: '00:00',
        };
    },
    methods: {
        async startOtpValidation() {
			this.loading = true;
			this.errorMsg = '';
			let formData = { otp_code: this.otpCode, token: this.$route.query.token }
			let rememberUser = false;
			let url = "/auth/validateotp";
			let payload = { formData, rememberUser, url };
			try{
				const loginData = await this.store.login(payload);
				if (loginData.token) {
					window.location = process.env.PUBLIC_URL || "/"; //user is now logged in. Navigate to home page
				}
				else{
					this.$router.push(loginData.nextpage);
				}
			}
			catch(request){
				this.errorMsg = request?.response?.data || "Unable to validate otp";
			}
			finally{
				this.loading = false;
			}
        },
        async resendOtp() {
            this.resending = true;
			this.errorMsg = '';
			let formData = {
				token:  this.$route.query.token
			}
			let url = "/auth/resendotp";
			try{
				await this.$api.post(url, formData);
				this.canResend = false;
				this.startCountDown();
				this.$q.notify({message: "OTP Sent Successfully", type: 'positive'});
			}
			catch(request){
				this.errorMsg = request?.response?.data || "Unable to resend otp";
			}
			finally{
				this.resending = false;
			}
        },
		startCountDown(){
			let duration = parseInt(this.$route.query.duration) || 5; // in minutes
			let minutes = 60 * duration;
			let timer = minutes;
			let seconds;
			var self = this;
			const interval = setInterval(function () {
				minutes = parseInt(timer / 60, 10);
				seconds = parseInt(timer % 60, 10);
				minutes = minutes < 10 ? "0" + minutes : minutes;
				seconds = seconds < 10 ? "0" + seconds : seconds;
				self.countDown = minutes + ":" + seconds;
				if (--timer < 0) {
					clearInterval(interval);
					self.errorMsg = "OTP has expired";
					self.canResend = true;
				}
			}, 1000);
		}
    },
	mounted() {
    	this.startCountDown();
	},
};
</script>
<style>
	.otp-input{
		font-weight: bold;
		font-size: 20px;
		text-align: center;
		letter-spacing: 10px;
	}
	.otp-input::placeholder{
		font-weight: normal;
		font-size: 14px;
		text-align: center;
		letter-spacing: 1px;
	}
</style>
