<template>
  <div class="error-page">
    <div class="error-blobs" aria-hidden="true">
      <div class="error-blob b1"></div>
      <div class="error-blob b2"></div>
    </div>
    <div class="error-content">
      <div class="error-icon" aria-hidden="true">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="#ed3a8c" stroke-width="3" opacity="0.25" />
          <path d="M28 30c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5M44 30c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" stroke="#ed3a8c" stroke-width="2.5" stroke-linecap="round" />
          <path d="M28 50c3 4 8 6 12 6s9-2 12-6" stroke="#ed3a8c" stroke-width="2.5" stroke-linecap="round" fill="none" transform="scale(1,-1) translate(0,-100)" />
        </svg>
      </div>
      <h1 class="error-code">{{ error?.statusCode || 404 }}</h1>
      <p class="error-message">{{ error?.statusCode === 404 ? 'ページが見つかりませんでした' : 'エラーが発生しました' }}</p>
      <p class="error-hint">URLが正しいか確認するか、トップページから探してみてください。</p>
      <button class="error-home-btn" @click="handleError">トップページへ戻る</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const handleError = () => clearError({ redirect: '/' })
</script>

<style scoped>
.error-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  font-family: 'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', sans-serif;
}

.error-blobs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.error-blob {
  position: absolute;
  opacity: 0.15;
  filter: blur(60px);
  animation: error-float 8s ease-in-out infinite alternate;
}
.error-blob.b1 {
  width: 300px;
  height: 300px;
  top: -80px;
  left: -60px;
  border-radius: 42% 58% 65% 35% / 55% 40% 60% 45%;
  background: radial-gradient(circle at 45% 45%, #ed3a8c, #ff4fa0 50%, transparent 75%);
}
.error-blob.b2 {
  width: 250px;
  height: 250px;
  bottom: -60px;
  right: -40px;
  border-radius: 55% 45% 38% 62% / 48% 60% 40% 52%;
  background: radial-gradient(circle at 55% 50%, #2dc7c0, #3dd4ce 50%, transparent 75%);
  animation-delay: -3s;
}

@keyframes error-float {
  to { transform: translate(12px, -8px) scale(1.04); }
}

.error-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 32px 24px;
}

.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.error-code {
  font-family: 'M PLUS Rounded 1c', sans-serif;
  font-size: 72px;
  font-weight: 800;
  color: #ed3a8c;
  margin: 0;
  line-height: 1;
  opacity: 0.85;
}

.error-message {
  font-size: 18px;
  font-weight: 700;
  color: #2a2a33;
  margin: 12px 0 8px;
}

.error-hint {
  font-size: 14px;
  color: #70707d;
  margin: 0 0 28px;
}

.error-home-btn {
  appearance: none;
  border: none;
  background: #ed3a8c;
  color: #fff;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  font-size: 15px;
  font-weight: 800;
  padding: 12px 32px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(237, 58, 140, 0.24);
}
.error-home-btn:hover {
  background: #d6357f;
  box-shadow: 0 6px 20px rgba(237, 58, 140, 0.32);
}
</style>
