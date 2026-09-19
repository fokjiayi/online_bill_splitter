document.addEventListener("DOMContentLoaded", () => {
  // Load Supabase config from config.js
  if (!window.SUPABASE_CONFIG) {
    alert("Missing Supabase config. Please copy config.example.js to config.js and fill in your credentials.");
    throw new Error("Missing Supabase config");
  }
  const supabaseUrl = window.SUPABASE_CONFIG.url;
  const supabaseKey = window.SUPABASE_CONFIG.key;
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized");

  // get session id from url
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("sessionid");

  console.log("Session ID:", sessionId);

  const getExpenses = async () => {
    let { data: session, error } = await supabase
      .from("session")
      .select("*")
      .eq("id", sessionId);

    if (error) {
      console.error(error);
    } else {
      console.log(session);
    }

    let { data: expenses, error: expensesError } = await supabase
      .from("expense")
      .select("*")
      .eq("session_id", sessionId);

    if (error) {
      console.error(expensesError);
    } else {
      console.log(expenses);
    }
  };

  if (sessionId != null) {
    getExpenses();
  }

  // --- SESSION CRUD ---
  window.supabaseSession = {
    // Create a session (handles both single and multi)
    async create({ title, participants, type = "single", parent = null, children = [] }) {
      if (type === "multi" && Array.isArray(children) && children.length > 0) {
        // Create parent session (title is the group name or first session name)
        const { data: parentSession, error: parentError } = await supabase
          .from("session")
          .insert([{ title, participants, type, parent: null }])
          .select()
          .single();
        if (parentError) throw parentError;
        // Create child sessions, each with parent id and their own title
        const childRows = children.map(childTitle => ({
          title: childTitle,
          participants,
          type: "multi",
          parent: parentSession.id
        }));
        const { data: childSessions, error: childError } = await supabase
          .from("session")
          .insert(childRows)
          .select();
        if (childError) throw childError;
        // Return parent and children
        return { parent: parentSession, children: childSessions };
      } else {
        // Single session or no children
        const { data, error } = await supabase
          .from("session")
          .insert([{ title, participants, type, parent }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    // Read session(s)
    async read({ id = null, parent = null } = {}) {
      let query = supabase.from("session").select("*");
      if (id) query = query.eq("id", id);
      if (parent) query = query.eq("parent", parent);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    // Update a session
    async update(id, updates) {
      const { data, error } = await supabase
        .from("session")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // Delete a session
    async delete(id) {
      const { error } = await supabase
        .from("session")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    },
  };

  // --- EXPENSE CRUD ---
  window.supabaseExpense = {
    // Create an expense
    async create(expense) {
      const { data, error } = await supabase
        .from("expense")
        .insert([expense])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // Read expense(s)
    async read({ id = null, session_id = null } = {}) {
      let query = supabase.from("expense").select("*");
      if (id) query = query.eq("id", id);
      if (session_id) query = query.eq("session_id", session_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    // Update an expense
    async update(id, updates) {
      const { data, error } = await supabase
        .from("expense")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // Delete an expense
    async delete(id) {
      const { error } = await supabase
        .from("expense")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    },
  };
});
