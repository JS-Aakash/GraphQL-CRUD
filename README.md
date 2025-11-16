
# GraphQL Full-Stack CRUD App

## Overview

A **complete full-stack GraphQL CRUD application** with:

- **Backend**: Node.js + Express + `express-graphql` + `data.json`
- **Frontend**: Pure HTML + JavaScript + **Tailwind CSS (CDN)**
- **Full CRUD** for **Users** and **Posts**

---

## Project Structure
```
graphql-crud/
│
├── backend/
│   ├── server.js         
│   ├── data.json         
│   └── package.json      
│
├── frontend/
│   └── index.html
│   └── script.js
└── README.md           
```

---

## How to Run Locally

### 1. **Start Backend**

```bash
cd backend
npm install
node server.js
```

**API runs at:** `http://localhost:4000/graphql`  
**GraphiQL UI:** Open in browser → Test queries

### 2. **Open Frontend**

```bash
cd frontend
npx serve .
```

Open: `http://localhost:5000`

---

## GraphQL API Endpoints

### **Single Endpoint:** `POST /graphql`

All operations go through **one HTTP endpoint**:

```
POST http://localhost:4000/graphql
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "query": "{ users { name } }",
  "variables": {}
}
```

---

## GraphQL Schema

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  age: Int
  posts: [Post]
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User
}

type Query {
  users: [User]
  user(id: ID!): User
  posts: [Post]
  post(id: ID!): Post
}

type Mutation {
  createUser(name: String!, email: String!, age: Int): User
  updateUser(id: ID!, name: String, email: String, age: Int): User
  deleteUser(id: ID!): Boolean

  createPost(title: String!, content: String!, authorId: ID!): Post
  updatePost(id: ID!, title: String, content: String): Post
  deletePost(id: ID!): Boolean
}
```

---

## GraphQL Queries (Examples)

### 1. **Get All Users + Their Posts**

```graphql
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
```

### 2. **Get One User**

```graphql
query {
  user(id: "1") {
    name
    email
    posts { title }
  }
}
```

### 3. **Get All Posts + Author**

```graphql
query {
  posts {
    title
    author {
      name
    }
  }
}
```

---

## GraphQL Mutations (Examples)

### 1. **Create User**

```graphql
mutation {
  createUser(name: "Alice", email: "alice@example.com", age: 25) {
    id
    name
  }
}
```

### 2. **Update User**

```graphql
mutation {
  updateUser(id: "1", name: "Alice Smith", age: 26) {
    name
    age
  }
}
```

### 3. **Delete User**

```graphql
mutation {
  deleteUser(id: "1")
}
```

### 4. **Create Post**

```graphql
mutation {
  createPost(title: "Hello", content: "My first post", authorId: "1") {
    id
    title
  }
}
```

### 5. **Update Post**

```graphql
mutation {
  updatePost(id: "p1", title: "Updated Title") {
    title
  }
}
```

### 6. **Delete Post**

```graphql
mutation {
  deletePost(id: "p1")
}
```

---

## How GraphQL Works (Simple Explanation)

| Concept | Explanation |
|-------|-------------|
| **Single Endpoint** | All data via `POST /graphql` |
| **Query** | Like `GET` — fetch data |
| **Mutation** | Like `POST/PUT/DELETE` — change data |
| **Schema** | Defines types, fields, queries |
| **Resolvers** | Functions that return data |
| **Nesting** | `user { posts { title } }` → one request |

---

## Test in GraphiQL (Browser)

1. Open: `http://localhost:4000/graphql`
2. Paste any query above
3. Click **Play**

---

## Local Testing (No Internet)

```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npx serve .
```

Open browser → `http://localhost:5000`

---
