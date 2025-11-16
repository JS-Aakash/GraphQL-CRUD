const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const DATA_FILE = path.join(__dirname, 'data.json');
let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const schema = buildSchema(`
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
`);

const root = {
    users: () => {
        return data.users.map(u => ({
            ...u,
            posts: data.posts.filter(p => p.authorId === u.id)
        }));
    },

    user: ({ id }) => {
        const u = data.users.find(u => u.id === id);
        if (!u) return null;
        return {
            ...u,
            posts: data.posts.filter(p => p.authorId === u.id)
        };
    },

    posts: () => data.posts.map(p => ({
        ...p,
        author: data.users.find(u => u.id === p.authorId) || null
    })),

    post: ({ id }) => {
        const p = data.posts.find(p => p.id === id);
        if (!p) return null;
        return {
            ...p,
            author: data.users.find(u => u.id === p.authorId) || null
        };
    },

    createUser: ({ name, email, age }) => {
        const newUser = { id: uuidv4().slice(0, 8), name, email, age: age ?? null };
        data.users.push(newUser);
        saveData();
        return newUser;
    },

    updateUser: ({ id, name, email, age }) => {
        const user = data.users.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        if (name) user.name = name;
        if (email) user.email = email;
        if (age !== undefined) user.age = age;
        saveData();
        return user;
    },

    deleteUser: ({ id }) => {
        const idx = data.users.findIndex(u => u.id === id);
        if (idx === -1) return false;
        data.users.splice(idx, 1);
        data.posts = data.posts.filter(p => p.authorId !== id);
        saveData();
        return true;
    },

    createPost: ({ title, content, authorId }) => {
        if (!data.users.find(u => u.id === authorId)) throw new Error('Author not found');
        const newPost = { id: uuidv4().slice(0, 8), title, content, authorId };
        data.posts.push(newPost);
        saveData();
        return newPost;
    },

    updatePost: ({ id, title, content }) => {
        const post = data.posts.find(p => p.id === id);
        if (!post) throw new Error('Post not found');
        if (title) post.title = title;
        if (content) post.content = content;
        saveData();
        return post;
    },

    deletePost: ({ id }) => {
        const idx = data.posts.findIndex(p => p.id === id);
        if (idx === -1) return false;
        data.posts.splice(idx, 1);
        saveData();
        return true;
    },
};

const app = express();
app.use(cors());
app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
}));

app.listen(4000, () => {
    console.log('Server running at http://localhost:4000/graphql');
});