module.exports = {
  projects: {
    app: {
      schema: ["tina/__generated__/schema.gql"],
      documents: [
        "tina/__generated__/queries.gql",
        "tina/__generated__/frags.gql",
        "pages/**/*.{graphql,js,ts,jsx,tsx}",
      ],
    },
  },
};
