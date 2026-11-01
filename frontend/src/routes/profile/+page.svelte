<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let username = $state('');
  let loading = $state(true);
  let errorMessage = $state('');

  onMount(async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(response)
      if (response.ok) {
        const data = await response.json();
        username = data.username;
      } else {
        goto('/login');
      }
    } catch (err) {
      errorMessage = 'Failed to load user profile.';
    } finally {
      loading = false;
    }
  });

  async function handleLogout() {
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (response.ok) {
        goto('/');
      }
    } catch (err) {
      console.error('Logout failed');
    }
  }
</script>

<main style="max-width: 400px; margin: 50px auto; font-family: sans-serif;">
  <h2>User Profile</h2>

  {#if loading}
    <p>Loading profile...</p>
  {:else if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {:else}
    <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px;">
      <p><strong>Username:</strong> {username}</p>
    </div>

    <div style="display: flex; gap: 10px;">
      <button onclick={handleLogout} style="padding: 8px 15px; background: #dc3545; color: white; border: none; cursor: pointer;">
        Log Out
      </button>
      <a href="/">Home page</a>
    </div>
  {/if}
</main>