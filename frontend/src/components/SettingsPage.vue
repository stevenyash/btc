<template>
    <q-page class="main-page">
      <section class="page-section q-pa-md">
        <div class="container-fluid">
          <div class="row q-col-gutter-x-md">
            <div class="col comp-grid">
              <div class="bg-positive nice-shadow-5 rounded-borders animated headShake">
                <div class="row items-center q-col-gutter-sm q-px-sm">
                  <div class="col-auto">
                    <q-avatar class="q-mr-sm" font-size="25px" size="40px" icon="supervisor_account" />
                  </div>
                  <div class="col">
                    <div class="text-h6 text-bold">All Setting </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Settings Shortcuts -->
      <section class="page-section q-pa-md">
        <div class="container-fluid">
          <div class="row q-col-gutter-md">
            <div v-for="setting in settings" :key="setting.name" class="col-md-3 col-12 comp-grid">
              <q-card class="nice-shadow-1 rounded-borders animated fadeIn">
                <q-btn
                  stack
                  outline
                  no-caps
                  unelevated
                  class="full-width q-pa-md"
                  :to="setting.route"
                  color="primary"
                >
                  <q-icon :name="setting.icon" size="30px" class="q-mb-sm" />
                  {{ setting.label }}
                </q-btn>
              </q-card>
            </div>
          </div>
        </div>
      </section>
    </q-page>
  </template>

  <script setup>
  import { ref } from "vue";

  // Define settings shortcuts
  const settings = ref([
    { name: "lesson", label: "Lesson Settings", icon: "school", route: "/lessonsetting" },
    { name: "services", label: "Services Settings", icon: "build", route: "/servicessettings" },
    { name: "guide", label: "Guide Settings", icon: "menu_book", route: "/userguide" },
    { name: "contact", label: "Contact Settings", icon: "contacts", route: "/contactusedit" },
    { name: "about", label: "About Us Settings", icon: "info", route: "/aboutus/aboutussetting" },
    { name: "packages", label: "Packages Settings", icon: "card_giftcard", route: "/packages" },
    { name: "subscriptions", label: "Subscriptions Settings", icon: "subscriptions", route: "/subscriptiontypes" },
    { name: "weekendtutorials", label: "Weekend Tutorials Settings", icon: "subscriptions", route: "/tutorialssettings" },
  ]);

  </script>

  <style scoped>
  .q-card {
    text-align: center;
  }
  </style>
