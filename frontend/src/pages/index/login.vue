<template>
  <q-page class="main-page" id="login-page">
    <section class="page-section q-mt-lg">
      <div class="container-fluid">
        <div class="row justify-center q-col-gutter-md">
          <div class="col-12 col-sm-8 col-md-6 col-lg-5 col-xl-4 login-column">
            <!-- Welcome Card -->
            <q-card :flat="isSubPage" class="q-pa-md nice-shadow-6 welcome-card">
              <div class="row justify-center q-col-gutter-md items-center">
                <q-avatar text-color="primary" font-size="48px" icon="account_circle"></q-avatar>
                <div class="text-h6 text-center">Welcome to BTC</div>
              </div>
            </q-card>

            <!-- Login Form -->
            <q-card :flat="isSubPage" class="q-my-md q-pa-md nice-shadow-6 login-form-card">
              <q-form ref="observer" @submit.prevent="startLogin">
                <q-input 
                  class="q-mb-md" 
                  label="Email / Phone Number" 
                  outlined 
                  dense
                  placeholder="email, or phone number" 
                  v-model.trim="formData.username" 
                  required 
                  type="text"
                  :rules="[val => !!val || 'Email or phone is required']"
                >
                  <template v-slot:prepend>
                    <q-icon name="account_circle"></q-icon>
                  </template>
                </q-input>
                
                <q-input 
                  class="q-mb-md" 
                  label="User Code" 
                  outlined 
                  dense 
                  placeholder="Enter your user code"
                  v-model="formData.usercode" 
                  required 
                  type="text"
                  :rules="[val => !!val || 'User code is required']"
                >
                  <template v-slot:prepend>
                    <q-icon name="lock"></q-icon>
                  </template>
                </q-input>

                <div class="row q-mb-md items-center">
                  <div class="col-6">
                    <q-checkbox v-model="rememberUser">Remember Me</q-checkbox>
                  </div>
                  <div class="col-6 text-right">
                    <q-btn @click="recover" flat no-caps color="negative" class="forgot-btn">
                      Recover user code?
                    </q-btn>
                  </div>
                </div>

                <!-- Login Error Message -->
                <transition appear enter-active-class="animated bounceIn" leave-active-class="animated fadeOut">
                  <q-banner v-if="loginErrorMsg" dense inline-actions class="bg-red-2 q-my-md login-error-banner">
                    <template v-slot:avatar>
                      <q-icon color="red" name="error"></q-icon>
                    </template>
                    {{ loginErrorMsg }}
                    <template v-slot:action>
                      <q-btn @click="loginErrorMsg = null" dense flat icon="close" />
                    </template>
                  </q-banner>
                </transition>

                <div class="text-center">
                  <q-btn 
                    label="Login" 
                    :loading="loading" 
                    color="primary" 
                    icon="lock_open" 
                    class="full-width login-btn"
                    type="submit" 
                    no-caps
                    unelevated
                  />
                </div>
              </q-form>
            </q-card>

            <!-- Recovery Message Banner -->
            <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
              <q-banner v-if="recoveryMessage" dense inline-actions :class="recoveryMessageType === 'positive' ? 'bg-green-2' : 'bg-red-2'" class="recovery-banner">
                <template v-slot:avatar>
                  <q-icon :name="recoveryMessageType === 'positive' ? 'check_circle' : 'error'" :color="recoveryMessageType === 'positive' ? 'green' : 'red'" />
                </template>
                {{ recoveryMessage }}
                <template v-slot:action>
                  <q-btn @click="recoveryMessage = null" dense flat icon="close" />
                </template>
              </q-banner>
            </transition>

            <!-- Register Prompt -->
            <q-card :flat="isSubPage" class="q-pa-md nice-shadow-6 register-card">
              <div class="row justify-between items-center no-wrap">
                <div class="col text-body2 register-text">
                  Don't have a subscription?
                </div>
                <div class="col-auto">
                  <q-btn 
                    icon="account_box" 
                    label="Subscribe" 
                    color="positive" 
                    to="subscriptionshow" 
                    no-caps
                    unelevated
                  />
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useAuth } from "src/composables/auth";
import { useRoute, useRouter } from "vue-router";
import { ApiService } from "src/services/api";
import { useQuasar } from 'quasar'

const formData = reactive({
  username: "254",
  usercode: "",
});

const $q = useQuasar();
const rememberUser = ref(false);
const loginErrorMsg = ref("");
const loading = ref(false);
const recoveryMessage = ref(null);
const recoveryMessageType = ref("positive");

const auth = useAuth();
const route = useRoute();
const router = useRouter();
import { useActivityStore } from "src/stores/useActivityStore";

const activityStore = useActivityStore();

async function startLogin() {
  try {
    loading.value = true;
    loginErrorMsg.value = "";
    const payload = {
      formData,
      rememberUser: rememberUser.value,
      url: "/auth/login",
    };
    const loginData = await auth.login(payload);
    loading.value = false;
    if (loginData.token) {
      // Fetch user data after successful login to populate userPages and rolePermissions
      await auth.getUserData();
    //  activityStore.startTracking();
      const nextUrl = route.query.nexturl || "/";
      router.go(nextUrl);
    } else {
      router.push(loginData.nextpage);
    }
  } catch (error) {
    console.log(error)
    loading.value = false;
    loginErrorMsg.value =
      error.request?.response || "Unable to establish connection...";
  }
}

async function recover() {
  $q.dialog({
    dark: true,
    title: "Verify Phone Number",
    message: "Enter the phone number you used to subscribe:",
    prompt: {
      model: "254",
      type: "number",
    },
    cancel: true,
    persistent: true,
  })
    .onOk(async (data) => {
      try {
        $q.loading.show({ message: "Sending SMS, please wait..." });

        const response = await ApiService.post("components_data/send_subscription_code", { phone_no: data });

        $q.loading.hide();

        // ✅ Set message to display on the web
        recoveryMessage.value = "A recovery message has been sent to your phone. Check your SMS.";
        recoveryMessageType.value = "positive"; // Green success message

      } catch (error) {
        $q.loading.hide();

        // ❌ Show error message on the page
        recoveryMessage.value = "Failed to send SMS. Please check your number or contact support.";
        recoveryMessageType.value = "negative"; // Red error message
      }
    })
    .onCancel(() => {
      console.log("User cancelled phone verification.");
    });
}
</script>

<style scoped>
.main-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-column {
  max-width: 480px;
  width: 100%;
}

.nice-shadow-6 {
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.q-btn.full-width {
  width: 100%;
}

.welcome-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.login-form-card {
  background: #ffffff;
}

.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.login-error-banner {
  border-radius: 8px;
}

.recovery-banner {
  border-radius: 8px;
  margin-bottom: 16px;
}

.register-card {
  background: #ffffff;
}

.register-text {
  color: #666;
}

.forgot-btn {
  font-size: 14px;
}

.forgot-btn:hover {
  text-decoration: underline;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .welcome-card {
    padding: 16px !important;
  }
  
  .login-form-card {
    padding: 16px !important;
  }
  
  .register-card {
    padding: 16px !important;
  }
  
  .login-btn {
    height: 44px;
    font-size: 14px;
  }
}

@media (min-width: 600px) and (max-width: 1023px) {
  .welcome-card,
  .login-form-card,
  .register-card {
    padding: 20px !important;
  }
}
</style>
