<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let username = $state('');
  let password = $state('');
  let errorMessage = $state('');

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();
    errorMessage = '';

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        goto('/profile');
      } else {
        const data = await response.json();
        errorMessage = data.message || 'Login failed';
        console.log(data)
      }
    } catch (err) {
      errorMessage = 'An error occurred during login.';
      console.log(err)
    }
  }
</script>

<main style="max-width: 400px; margin: 50px auto; font-family: sans-serif;">
  <h2>Login</h2>
  
  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}

  <form onsubmit={handleLogin} style="display: flex; flex-direction: column; gap: 10px;">
    <label>
      Username:
      <input type="text" bind:value={username} required style="width: 100%; padding: 8px;" />
    </label>
    
    <label>
      Password:
      <input type="password" bind:value={password} required style="width: 100%; padding: 8px;" />
    </label>

    <button type="submit" style="padding: 10px; background: #007bff; color: white; border: none; cursor: pointer;">
      Log In
    </button>
  </form>
</main>