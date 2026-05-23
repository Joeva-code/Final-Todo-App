const migrateDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    
    // Check if todos table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'todos'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Create todos table
      await client.query(`
        CREATE TABLE todos (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Todos table created');
    } else {
      // Check if user_id column exists
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'todos' AND column_name = 'user_id'
        )
      `);
      
      if (!columnCheck.rows[0].exists) {
        // Add user_id column if it doesn't exist
        await client.query(`
          ALTER TABLE todos 
          ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('✅ Added user_id column to todos table');
      }
      
      // Add other columns if missing
      const columns = ['title', 'description', 'completed', 'created_at', 'updated_at'];
      for (const column of columns) {
        const columnExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'todos' AND column_name = $1
          )
        `, [column]);
        
        if (!columnExists.rows[0].exists) {
          let columnDef = '';
          switch(column) {
            case 'title':
              columnDef = 'VARCHAR(255) NOT NULL';
              break;
            case 'description':
              columnDef = 'TEXT';
              break;
            case 'completed':
              columnDef = 'BOOLEAN DEFAULT FALSE';
              break;
            case 'created_at':
              columnDef = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
              break;
            case 'updated_at':
              columnDef = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
              break;
          }
          await client.query(`ALTER TABLE todos ADD COLUMN ${column} ${columnDef}`);
          console.log(`✅ Added ${column} column to todos table`);
        }
      }
    }
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};