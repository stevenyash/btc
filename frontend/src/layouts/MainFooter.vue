<template>
  <q-btn
    label="See Our User Guide"
    to="guide"
    class="q-mb-md"
    size="sm"
    :dense="$q.screen.lt.md"
  />

  <div class="row q-col-gutter-md justify-center">
    <!-- Newsletter Subscription -->
    <div class="col-12 col-sm-6 col-md-4">
      <div class="text-center text-sm-left">
        <h3 class="text-h6 text-weight-bold q-mb-md">Subscribe To Newsletter</h3>
      </div>

      <NewsLeter :show-header="false" />

      <div class="text-center q-mt-sm">
        <p v-if="message" class="text-green text-caption text-sm-body2">{{ message }}</p>
        <p v-if="error" class="text-red text-caption text-sm-body2">{{ error }}</p>
      </div>
    </div>

    <!-- Contact Information -->
    <div class="col-12 col-sm-6 col-md-4">
      <div class="text-center text-sm-left">
        <h3 class="text-h6 text-weight-bold q-mb-md">Contact Us</h3>
      </div>

      <div class="q-gutter-y-sm">
        <div class="flex items-center justify-center justify-sm-start">
          <q-icon name="phone" class="text-primary q-mr-sm" size="sm" />
          <span class="text-body2">Call Us: +254 (0) 722310358</span>
        </div>

        <div class="flex items-center justify-center justify-sm-start">
          <q-icon name="email" class="text-primary q-mr-sm" size="sm" />
          <span class="text-body2">Email Us: info@bitstutorconnect.co.ke</span>
        </div>

        <div class="flex items-center justify-center justify-sm-start">
          <q-icon name="place" class="text-primary q-mr-sm" size="sm" />
          <span class="text-body2">Write Us: P.O Box 955-90200, Kitui</span>
        </div>
      </div>
    </div>

    <!-- Important Links -->
    <div class="col-12 col-md-4">
      <div class="text-center text-md-left">
        <h3 class="text-h6 text-weight-bold q-mb-md">Important Links</h3>
      </div>

      <div class="row justify-center justify-md-start q-col-gutter-xs">
        <div class="col-6 col-sm-4 col-md-12" v-for="link in links" :key="link.to">
          <q-btn
            flat
            dense
            :label="link.label"
            :to="link.to"
            class="full-width full-width-md-auto"
            size="sm"
            no-caps
          />
        </div>
      </div>

      <!-- Social Media Links -->
      <div class="q-mt-md">
        <div class="text-center text-md-left q-mb-sm">
          <span class="text-caption text-grey-7">Follow Us</span>
        </div>
        <div class="row justify-center justify-md-start q-gutter-sm">
          <q-btn flat round dense icon="facebook" color="primary" size="sm" href="https://facebook.com" target="_blank" />
          <q-btn flat round dense icon="language" color="info" size="sm" href="https://bitstutorconnect.co.ke" target="_blank" />
          <q-btn flat round dense icon="play_circle" color="red" size="sm" href="https://youtube.com" target="_blank" />
          <q-btn flat round dense icon="chat" color="positive" size="sm" href="https://wa.me/254722310358" target="_blank" />
        </div>
      </div>

      <!-- Legal Links -->
      <div class="q-mt-md row justify-center justify-md-start q-gutter-sm">
        <q-btn flat dense size="xs" label="Privacy Policy" to="/privacy" no-caps class="text-caption" />
        <q-btn flat dense size="xs" label="Terms of Service" to="/terms" no-caps class="text-caption" />
      </div>
    </div>
  </div>

  <div class="text-grey-7 text-center q-mt-lg q-mb-sm text-caption text-sm-body2">
    &copy; {{ new Date().getFullYear() }} {{ $appName }}. All Rights Reserved
    
    <!-- Install App Button -->
    <div class="q-mt-sm">
      <q-btn 
        flat 
        dense 
        size="sm" 
        icon="download" 
        label="Install App" 
        @click="installApp"
        no-caps
        class="text-primary"
      />
    </div>
  </div>
</template>

<script setup>
import { ApiService } from "src/services/api";
import { utils } from "src/utils";
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import NewsLeter from "src/pages/newslettersubscribers/add.vue";

const $q = useQuasar();

const email = ref("");
const message = ref("");
const error = ref("");

const links = computed(() => [
  { label: "Home", to: "/" },
  { label: "Services", to: "/services" },
  { label: "About Us", to: "/aboutus" },
  { label: "Holiday Package", to: "/buypackages" },
  { label: "Contact Us", to: "/contactus" },
  { label: "User Guide", to: "/guide" }
]);

async function subscribe() {
  if (!email.value) {
    error.value = "Please enter a valid email.";
    return;
  }

  try {
    const response = await ApiService.post("newslettersubscribers/add", {
      email: email.value,
      subscribed_at: utils.dateNow(),
    });

    if (response.data.success) {
      message.value = "You have successfully subscribed!";
      error.value = "";
      email.value = "";
    } else {
      error.value = response.data.message || "Subscription failed.";
    }
  } catch (e) {
    error.value = "An error occurred. Please try again later.";
    console.error(e);
  }
}

function installApp() {
  $q.dialog({
    title: 'Install BTC App',
    message: 'To install our app on your device:\n\n1. Open this website in your browser\n2. Tap the Share button (iOS) or Menu button (Android)\n3. Select "Add to Home Screen" or "Install App"\n\nOur PWA provides the best experience on mobile devices!',
    ok: {
      label: 'Got it',
      color: 'primary'
    }
  });
}
</script>

<style scoped>
/* Extra small devices (phones) */
@media (max-width: 599px) {
  .row {
    margin-left: -8px;
    margin-right: -8px;
  }

  h3.text-h6 {
    font-size: 1.1rem;
    line-height: 1.3;
  }
}

/* Small devices (tablets portrait) */
@media (min-width: 600px) and (max-width: 1023px) {
  .row {
    margin-left: -12px;
    margin-right: -12px;
  }
}

/* Large devices (desktops) */
@media (min-width: 1024px) {
  .row {
    margin-left: -16px;
    margin-right: -16px;
  }
}

/* Ensure buttons are properly spaced on mobile */
.q-btn {
  min-height: 36px;
}

/* Improve text readability on small screens */
.text-body2 {
  font-size: 0.875rem;
  line-height: 1.4;
}

@media (max-width: 599px) {
  .text-body2 {
    font-size: 0.8125rem;
  }

  .q-icon {
    font-size: 1rem;
  }
}

/* Stack items vertically on very small screens */
@media (max-width: 374px) {
  .flex.items-center {
    flex-direction: column;
    text-align: center;
    gap: 4px;
  }

  .q-icon {
    margin-right: 0;
    margin-bottom: 4px;
  }
}

/* Adjust button layout for links on different screens */
@media (max-width: 599px) {
  .col-6 {
    margin-bottom: 4px;
  }
}

@media (min-width: 600px) and (max-width: 1023px) {
  .col-sm-4 {
    margin-bottom: 8px;
  }
}

/* Ensure content doesn't touch screen edges on mobile */
.container-class {
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
}
</style>
