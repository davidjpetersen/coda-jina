import * as coda from "@codahq/packs-sdk";
export const pack = coda.newPack();

// Allow the Pack to access the Jina.ai API domains.
pack.addNetworkDomain("jina.ai");

// Setup authentication for Jina.ai API.
// Get your Jina AI API key for free: https://jina.ai/?sui=apikey
pack.setUserAuthentication({
  type: coda.AuthenticationType.HeaderBearerToken,
  instructionsUrl: "https://jina.ai/docs/authentication",
});

// Define a common schema for fetched content (used by Reader and related formulas).
const ContentSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, required: true },
    title: { type: coda.ValueType.String, required: true },
    content: { type: coda.ValueType.String, required: true },
    url: { type: coda.ValueType.String, codaType: coda.ValueHintType.Url, required: true },
  },
  displayProperty: "title",
  idProperty: "id",
  featuredProperties: ["title", "url"],
});

// -----------------------
// Embeddings API
// -----------------------
pack.addFormula({
  name: "GetEmbeddings",
  description: "Generate embeddings for given text or images using the Jina.ai Embeddings API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: "input",
      description: "Array of input strings or objects to be embedded.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "model",
      description: "Identifier of the model to use.",
      optional: true,
      suggestedValue: "jina-embeddings-v3",
    }),
  ],
  resultType: coda.ValueType.Array,
  items: coda.makeObjectSchema({
    properties: {
      embedding: { type: coda.ValueType.String },
    },
  }),
  execute: async function ([input, model], context) {
    let url = "https://api.jina.ai/v1/embeddings";
    let response = await context.fetcher.fetch({
      method: "POST",
      url: url,
      headers: {
        "Authorization": `Bearer ${context.endpoint}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "jina-embeddings-v3",
        input: input,
      }),
    });
    return response.body.data;
  },
});

// -----------------------
// Reranker API
// -----------------------
pack.addFormula({
  name: "RerankDocuments",
  description: "Rerank documents based on a query using the Jina.ai Reranker API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "query",
      description: "The search query.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: "documents",
      description: "A list of text documents or strings to rerank.",
    }),
  ],
  resultType: coda.ValueType.Array,
  items: coda.makeObjectSchema({
    properties: {
      index: { type: coda.ValueType.Number },
      relevance_score: { type: coda.ValueType.Number },
      document: { type: coda.ValueType.String },
    },
  }),
  execute: async function ([query, documents], context) {
    let url = "https://api.jina.ai/v1/rerank";
    let response = await context.fetcher.fetch({
      method: "POST",
      url: url,
      headers: {
        "Authorization": `Bearer ${context.endpoint}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-reranker-v2-base-multilingual",
        query: query,
        documents: documents,
      }),
    });
    return response.body.results;
  },
});

// -----------------------
// Reader API
// -----------------------
pack.addFormula({
  name: "ReadContent",
  description: "Retrieve and parse content from a URL using the Jina.ai Reader API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "url",
      description: "The URL to retrieve content from.",
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: ContentSchema,
  execute: async function ([url], context) {
    // The Reader API endpoint converts the URL into LLM-friendly content.
    let apiUrl = "https://r.jina.ai/";
    let response = await context.fetcher.fetch({
      method: "POST",
      url: apiUrl,
      headers: {
        "Authorization": `Bearer ${context.endpoint}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url }),
    });
    // Return the data (assumes content is in response.data).
    return response.body.data;
  },
});

// -----------------------
// Search API
// -----------------------
pack.addFormula({
  name: "SearchWeb",
  description: "Search the web using the Jina.ai Search API and return LLM-friendly results.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "query",
      description: "The search query.",
    }),
  ],
  resultType: coda.ValueType.Array,
  items: coda.makeObjectSchema({
    properties: {
      title: { type: coda.ValueType.String },
      description: { type: coda.ValueType.String },
      url: { type: coda.ValueType.String, codaType: coda.ValueHintType.Url },
      content: { type: coda.ValueType.String },
    },
  }),
  execute: async function ([query], context) {
    let url = "https://s.jina.ai/";
    let response = await context.fetcher.fetch({
      method: "POST",
      url: url,
      headers: {
        "Authorization": `Bearer ${context.endpoint}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query }),
    });
    return response.body.data;
  },
});

// -----------------------
// Grounding API
// -----------------------
pack.addFormula({
  name: "VerifyStatement",
  description: "Verify the factual accuracy of a statement using the Jina.ai Grounding API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "statement",
      description: "The statement to verify.",
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: coda.makeObjectSchema({
    properties: {
      factuality: { type: coda.ValueType.Number },
      result: { type: coda.ValueType.Boolean },
      reason: { type: coda.ValueType.String },
      references: { type: coda.ValueType.Array, items: coda.makeObjectSchema({
        properties: {
          url: { type: coda.ValueType.String, codaType: coda.ValueHintType.Url },
          keyQuote: { type: coda.ValueType.String },
          isSupportive: { type: coda.ValueType.Boolean },
        },
      })},
    },
  }),
  execute: async function ([statement], context) {
    let url = "https://g.jina.ai/";
    let response = await context.fetcher.fetch({
      method: "POST",
      url: url,
      headers: {
        "Authorization": `Bearer ${context.endpoint}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ statement: statement }),
    });
    return response.body.data;
  },
});

// -----------------------
// Segmenter API
// -----------------------
pack.addFormula({
  name: "SegmentText",
  description: "Segment text into chunks using the Jina.ai Segmenter API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "content",
      description: "The text content to segment.",
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: coda.makeObjectSchema({
    properties: {
      num_tokens: { type: coda.ValueType.Number },
      num_chunks: { type: coda.ValueType.Number },
      chunks: { type: coda.ValueType.Array, items: { type: coda.ValueType.String } },
    },
  }),
  execute: async function ([content], context) {
    let url = "https://segment.jina.ai/";
    let response = await context.fetcher.fetch({
      method: "POST",
      url: url,
      headers: {
        "Authorization": `Bearer ${context.endpoint}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content,
        return_chunks: true
      }),
    });
    return response.body;
  },
});

// -----------------------
// Classifier API
// -----------------------
pack.addFormula({
  name: "ClassifyText",
  description: "Classify text inputs using the Jina.ai Classifier API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: "input",
      description: "Array of text inputs for classification.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: "labels",
      description: "List of labels to use for classification.",
    }),
  ],
  resultType: coda.ValueType.Array,
  items: coda.makeObjectSchema({
    properties: {
      index: { type: coda.ValueType.Number },
      prediction: { type: coda.ValueType.String },
      score: { type: coda.ValueType.Number },
    },
  }),
  execute: async function ([input, labels], context) {
    let url = "https://api.jina.ai/v1/classify";
    let response = await context.fetcher.fetch({
      method: "POST",
      url: url,
      headers: {
        "Authorization": `Bearer ${context.endpoint}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        input: input,
        labels: labels,
      }),
    });
    return response.body.data;
  },
});

// -----------------------
// (Optional) Additional Reader Formulas
// These formulas use legacy endpoints for content search and related content fetching.
// Depending on your needs you may keep, update, or remove these.

// Fetch content by query (legacy endpoint)
pack.addFormula({
  name: "FetchContent",
  description: "Fetch content by query using the legacy Jina.ai Reader API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "query",
      description: "The query to search for content.",
    }),
  ],
  resultType: coda.ValueType.Array,
  items: ContentSchema,
  execute: async function ([query], context) {
    let url = coda.withQueryParams("https://api.jina.ai/reader/search", { query: query });
    let response = await context.fetcher.fetch({
      method: "GET",
      url: url,
    });
    return response.body.items.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url,
    }));
  },
});

// Fetch specific content by ID (legacy endpoint)
pack.addFormula({
  name: "FetchContentById",
  description: "Fetch specific content by ID using the legacy Jina.ai Reader API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "id",
      description: "The content ID to fetch.",
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: ContentSchema,
  execute: async function ([id], context) {
    let url = `https://api.jina.ai/reader/content/${id}`;
    let response = await context.fetcher.fetch({
      method: "GET",
      url: url,
    });
    let item = response.body;
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url,
    };
  },
});

// Fetch related content (legacy endpoint)
pack.addFormula({
  name: "FetchRelatedContent",
  description: "Fetch related content using the legacy Jina.ai Reader API.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "id",
      description: "The content ID for which to fetch related content.",
    }),
  ],
  resultType: coda.ValueType.Array,
  items: ContentSchema,
  execute: async function ([id], context) {
    let url = `https://api.jina.ai/reader/content/${id}/related`;
    let response = await context.fetcher.fetch({
      method: "GET",
      url: url,
    });
    return response.body.items.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url,
    }));
  },
});
