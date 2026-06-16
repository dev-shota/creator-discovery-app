<script setup lang="ts">
const error = createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
if (import.meta.server) {
  throw error
} else {
  showError(error)
}
</script>
