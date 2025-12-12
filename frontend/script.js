const cache = window.localStorage.getItem('graphql-cache') ? JSON.parse(window.localStorage.getItem('graphql-cache')) : {};

async function gql(query, variables = {}) {
    if (cache[query]) {
        return cache[query];
    }
    const res = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    const result = json.data;
    cache[query] = result;
    window.localStorage.setItem('graphql-cache', JSON.stringify(cache));
    return result;
}

// ... (rest of the code remains the same)