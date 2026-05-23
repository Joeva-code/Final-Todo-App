const { pool } = require('../config/database.js');

class Todo {
    // Create a new todo
    static async create(todoData) {
        const { title, description, priority, due_date } = todoData;
        const query = `
            INSERT INTO todos (title, description, priority, due_date)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [title, description, priority || 2, due_date || null];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get all todos with optional filtering
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM todos';
        const values = [];
        const conditions = [];
        let paramCounter = 1;

        if (filters.completed !== undefined && filters.completed !== '') {
            conditions.push(`completed = $${paramCounter++}`);
            values.push(filters.completed === 'true');
        }

        if (filters.priority) {
            conditions.push(`priority = $${paramCounter++}`);
            values.push(parseInt(filters.priority));
        }

        if (filters.search) {
            conditions.push(`(title ILIKE $${paramCounter++} OR description ILIKE $${paramCounter++})`);
            values.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Add sorting
        const sortBy = filters.sortBy || 'created_at';
        const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        // Add pagination
        if (filters.limit) {
            query += ` LIMIT $${paramCounter++}`;
            values.push(parseInt(filters.limit));
        }
        
        if (filters.offset) {
            query += ` OFFSET $${paramCounter++}`;
            values.push(parseInt(filters.offset));
        }

        try {
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Get single todo by ID
    static async findById(id) {
        const query = 'SELECT * FROM todos WHERE id = $1';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Update todo
    static async update(id, updates) {
        const fields = [];
        const values = [];
        let valueCounter = 1;

        if (updates.title !== undefined) {
            fields.push(`title = $${valueCounter++}`);
            values.push(updates.title);
        }
        if (updates.description !== undefined) {
            fields.push(`description = $${valueCounter++}`);
            values.push(updates.description);
        }
        if (updates.completed !== undefined) {
            fields.push(`completed = $${valueCounter++}`);
            values.push(updates.completed);
        }
        if (updates.priority !== undefined) {
            fields.push(`priority = $${valueCounter++}`);
            values.push(updates.priority);
        }
        if (updates.due_date !== undefined) {
            fields.push(`due_date = $${valueCounter++}`);
            values.push(updates.due_date);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE todos 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${valueCounter}
            RETURNING *
        `;

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Delete todo
    static async delete(id) {
        const query = 'DELETE FROM todos WHERE id = $1 RETURNING id';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Toggle todo completion status
    static async toggleComplete(id) {
        const query = `
            UPDATE todos 
            SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get statistics
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN NOT completed THEN 1 ELSE 0 END) as pending,
                ROUND(AVG(priority), 2) as avg_priority,
                MIN(created_at) as oldest_todo,
                MAX(created_at) as newest_todo,
                COUNT(CASE WHEN due_date < CURRENT_DATE AND NOT completed THEN 1 END) as overdue
            FROM todos
        `;
        try {
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Bulk delete completed todos
    static async deleteCompleted() {
        const query = 'DELETE FROM todos WHERE completed = true RETURNING id';
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Todo;