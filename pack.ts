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
// Reader API
// -----------------------
pack.addFormula({
  name: "ReadContent",
  description: "Retrieve and parse content from a URL using the Jina.ai Reader API. Header options can be specified separately.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "url",
      description: "The URL to retrieve content from.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "xEngine",
      description: "Optional: Specifies the engine to use. Use 'readerlm-v2' for higher quality or 'direct' for speed.",
      optional: true,
      suggestions: ["readerlm-v2", "direct"],
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: "xTimeout",
      description: "Optional: Maximum time (in seconds) to wait for the webpage to load.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "xTargetSelector",
      description: "Optional: CSS selectors to focus on specific elements within the page.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "xWaitForSelector",
      description: "Optional: CSS selectors to wait for specific elements before returning.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "xRemoveSelector",
      description: "Optional: CSS selectors to exclude certain parts of the page (e.g., headers, footers).",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "xWithLinksSummary",
      description: "Optional: Set to true to gather all links at the end of the response.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "xWithImagesSummary",
      description: "Optional: Set to true to gather all images at the end of the response.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "xWithGeneratedAlt",
      description: "Optional: Set to true to add alt text to images lacking captions.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "xNoCache",
      description: "Optional: Set to true to bypass cache for fresh retrieval.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "xWithIframe",
      description: "Optional: Set to true to include iframe content in the response.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "xReturnFormat",
      description: "Optional: Specify the return format: markdown, html, text, screenshot, or pageshot.",
      optional: true,
      suggestions: ["markdown", "html", "text", "screenshot", "pageshot"],
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: "xTokenBudget",
      description: "Optional: Maximum number of tokens to use for the request.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "xRetainImages",
      description: "Optional: Use 'none' to remove all images from the response.",
      optional: true,
      suggestions: ["none"],
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: ContentSchema,
  execute: async function (
    [
      url,
      xEngine,
      xTimeout,
      xTargetSelector,
      xWaitForSelector,
      xRemoveSelector,
      xWithLinksSummary,
      xWithImagesSummary,
      xWithGeneratedAlt,
      xNoCache,
      xWithIframe,
      xReturnFormat,
      xTokenBudget,
      xRetainImages,
    ],
    context
  ) {
    let apiUrl = "https://r.jina.ai/";
    let payload: any = { url };

    // Build request headers with required defaults.
    let headers: { [key: string]: string } = {
      "Authorization": `Bearer ${context.endpoint}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    // Add optional headers if provided.
    if (xEngine) headers["X-Engine"] = xEngine;
    if (xTimeout !== undefined) headers["X-Timeout"] = String(xTimeout);
    if (xTargetSelector) headers["X-Target-Selector"] = xTargetSelector;
    if (xWaitForSelector) headers["X-Wait-For-Selector"] = xWaitForSelector;
    if (xRemoveSelector) headers["X-Remove-Selector"] = xRemoveSelector;
    if (xWithLinksSummary === true) headers["X-With-Links-Summary"] = "true";
    if (xWithImagesSummary === true) headers["X-With-Images-Summary"] = "true";
    if (xWithGeneratedAlt === true) headers["X-With-Generated-Alt"] = "true";
    if (xNoCache === true) headers["X-No-Cache"] = "true";
    if (xWithIframe === true) headers["X-With-Iframe"] = "true";
    if (xReturnFormat) headers["X-Return-Format"] = xReturnFormat;
    if (xTokenBudget !== undefined) headers["X-Token-Budget"] = String(xTokenBudget);
    if (xRetainImages) headers["X-Retain-Images"] = xRetainImages;

    let response = await context.fetcher.fetch({
      method: "POST",
      url: apiUrl,
      headers: headers,
      body: JSON.stringify(payload),
    });

    return response.body.data;
  },
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
      references: {
        type: coda.ValueType.Array, items: coda.makeObjectSchema({
          properties: {
            url: { type: coda.ValueType.String, codaType: coda.ValueHintType.Url },
            keyQuote: { type: coda.ValueType.String },
            isSupportive: { type: coda.ValueType.Boolean },
          },
        })
      },
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
