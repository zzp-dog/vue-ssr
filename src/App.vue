<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home1</router-link> |
      <router-link to="/about">About1</router-link>
    </div>
    <router-view/>
  </div>
</template>
<script lang="ts" src="./app.ts"></script>
<style lang="scss" src="./app.scss"></style>