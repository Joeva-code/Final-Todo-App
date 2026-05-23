const { pool } = require('../config/database.js');

class Todo {
    // Create a new todo for a specific user
    static async create(todoData, userId) {
        const { title, description, priority, due_date } = todoData;
        const query = `
            INSERT INTO todos (user_id, title, description, priority, due_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [userId, title, description, priority || 2, due_date || null];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get all todos for a specific user
    static async findAll(userId, filters = {}) {
        let query = 'SELECT * FROM todos WHERE user_id = $1';
        const values = [userId];
        let paramCounter = 2;

        if (filters.completed !== undefined && filters.completed !== '') {
            query += ` AND completed = $${paramCounter++}`;
            values.push(filters.completed === 'true');
        }

        if (filters.priority) {
            query += ` AND priority = $${paramCounter++}`;
            values.push(parseInt(filters.priority));
        }

        if (filters.search) {
            query += ` AND (title ILIKE $${paramCounter++} OR description ILIKE $${paramCounter++})`;
            values.push(`%${filters.search}%`, `%${filters.search}%`);
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

    // Get single todo by ID (ensure it belongs to user)
    static async findById(id, userId) {
        const query = 'SELECT * FROM todos WHERE id = $1 AND user_id = $2';
        try {
            const result = await pool.query(query, [id, userId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Update todo (ensure it belongs to user)
    static async update(id, userId, updates) {
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

        values.push(id, userId);
        const query = `
            UPDATE todos 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${valueCounter} AND user_id = $${valueCounter + 1}
            RETURNING *
        `;

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Delete todo (ensure it belongs to user)
    static async delete(id, userId) {
        const query = 'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id';
        try {
            const result = await pool.query(query, [id, userId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Toggle todo completion (ensure it belongs to user)
    static async toggleComplete(id, userId) {
        const query = `
            UPDATE todos 
            SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        try {
            const result = await pool.query(query, [id, userId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get statistics for a specific user
    static async getStats(userId) {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN NOT completed THEN 1 ELSE 0 END) as pending,
                ROUND(AVG(priority), 2) as avg_priority,
                COUNT(CASE WHEN due_date < CURRENT_DATE AND NOT completed THEN 1 END) as overdue
            FROM todos
            WHERE user_id = $1
        `;
        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Todo;