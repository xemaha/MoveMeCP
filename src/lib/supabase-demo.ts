// Lightweight in-memory Supabase stub for local/demo usage
// Provides the minimal surface needed by the app without throwing when env vars are missing

type QueryResult = { data: any; error: null }

const emptyResult: QueryResult = { data: [], error: null }
const emptySingle: QueryResult = { data: null, error: null }

// Simple builder that mimics the chainable API surface we use in the app.
const makeBuilder = () => {
	const b: any = {}
	const chain = () => b

	b.select = chain
	b.eq = chain
	b.in = chain
	b.not = chain
	b.order = chain
	b.limit = chain
	b.range = chain
	b.returning = chain
	b.delete = chain

	b.insert = async () => emptyResult
	b.update = async () => emptyResult
	b.upsert = async () => emptyResult
	b.maybeSingle = async () => emptySingle
	b.single = async () => emptySingle

	// Make await on the builder resolve to an empty result
	b.then = (resolve: (value: QueryResult) => void) => resolve(emptyResult)

	return b
}

const builder = makeBuilder()

export const supabase = {
	from: () => builder,
	auth: {
		getUser: async () => ({ data: { user: null }, error: null })
	}
}

export default supabase
