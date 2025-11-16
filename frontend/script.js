
async function gql(query, variables = {}) {
  const res = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

// DOM Elements
const userForm = document.getElementById('userForm')
const usersDiv = document.getElementById('users')

// Load users
async function loadUsers() {
  usersDiv.innerHTML = '<p class="loading">Loading users...</p>'
  try {
    const data = await gql(`
      query {
        users {
          id
          name
          email
          age
          posts {
            id
            title
            content
          }
        }
      }
    `)
    renderUsers(data.users)
  } catch (err) {
    usersDiv.innerHTML = `<p style="color:red">Error: ${err.message}</p>`
  }
}

// Render users
function renderUsers(users) {
  if (users.length === 0) {
    usersDiv.innerHTML = '<p>No users yet.</p>'
    return
  }

  usersDiv.innerHTML = users.map(user => `
    <div class="user-card">
      <h3>${escape(user.name)} <small>(${escape(user.email)})</small></h3>
      ${user.age ? `<p><strong>Age:</strong> ${user.age}</p>` : ''}
      
      <div class="posts">
        <h4>Posts:</h4>
        ${user.posts.length ? user.posts.map(post => `
          <div class="post">
            <strong>${escape(post.title)}</strong>: ${escape(post.content)}
            <button class="delete-btn" onclick="deletePost('${post.id}')">Delete</button>
          </div>
        `).join('') : '<em>No posts</em>'}
      </div>
    </div>
  `).join('')
}

// Escape HTML
function escape(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// Delete post
window.deletePost = async (postId) => {
  if (!confirm('Delete this post?')) return
  try {
    await gql(`mutation { deletePost(id: "${postId}") }`)
    loadUsers()
  } catch (err) {
    alert('Delete failed: ' + err.message)
  }
}

// Add user
userForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = document.getElementById('name').value
  const email = document.getElementById('email').value
  const age = document.getElementById('age').value

  try {
    await gql(`
      mutation($n:String!,$e:String!,$a:Int){
        createUser(name:$n,email:$e,age:$a){id}
      }
    `, {
      n: name,
      e: email,
      a: age ? parseInt(age) : null
    })
    userForm.reset()
    loadUsers()
  } catch (err) {
    alert('Error: ' + err.message)
  }
})

// Initial load
loadUsers()