import React from 'react'

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  
  return (
     <form onSubmit={handleSignup}>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="user">User</option>
        <option value="organizer">Organizer</option>
      </select>
      <button type="submit">Sign Up</button>
      {error && <p>{error}</p>}
    </form>
  )
}

export default SignUp