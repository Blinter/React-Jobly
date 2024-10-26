/**
 * @fileoverview Unit tests for the sqlForPartialUpdate helper function.
 * This module provides a suite of tests to ensure the correct functionality
 * of the sqlForPartialUpdate function, which is used to generate SQL update
 * queries dynamically based on provided data and column mappings.
 *
 * The tests cover various scenarios including handling of different data types,
 * nested objects, undefined and null values, and edge cases.
 *
 * @module sql.test
 * @requires ../helpers/sql
 * @requires ../expressError
 * @requires ../models/_testCommon
 */

"use strict";

const { sqlForPartialUpdate } = require('../helpers/sql');
const { BadRequestError } = require('../expressError');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll
} = require('../models/_testCommon');

/**
 * Test suite for sqlForPartialUpdate function which covers various
 * scenarios to ensure its robustness including different data types,
 * case conversion, handling of undefined and null values, and much more.
 */
describe('sqlForPartialUpdate', () => {
    beforeAll(commonBeforeAll);
    beforeEach(commonBeforeEach);
    afterEach(commonAfterEach);
    afterAll(commonAfterAll);

    /**
     * Test whether sqlForPartialUpdate correctly processes an update
     * with a single field, converting it to the proper SQL statement.
     */
    test('works with one field', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya' },
            { firstName: 'first_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1',
            values: ['Aliya'],
        });
    });

    /**
     * Test whether sqlForPartialUpdate correctly processes multiple fields
     * and converts them to a valid SQL statement with appropriate columns.
     */
    test('works with multiple fields', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya', age: 32 },
            { firstName: 'first_name', age: 'age' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ['Aliya', 32],
        });
    });

    /**
     * Ensure that sqlForPartialUpdate handles case conversion correctly,
     * mapping field names to their respective SQL column names.
     */
    test('handles case conversion', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya', age: 32 },
            { firstName: 'first_name', age: 'age' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ['Aliya', 32],
        });
    });

    /**
     * Verify sqlForPartialUpdate skips any unchanged fields, generating an
     * update SQL statement only for those fields that have new values.
     */
    test('ignores unchanged fields', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya' },
            { firstName: 'first_name', age: 'age' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1',
            values: ['Aliya'],
        });
    });

    /**
     * Confirm that sqlForPartialUpdate throws an error when no data is
     * provided, as there would be nothing to update in such a case.
     */
    test('throws error if no data', () => {
        expect(() => sqlForPartialUpdate({}, {})).toThrow(BadRequestError);
    });

    /**
     * Ensure the function uses the original column name in the SQL statement
     * if a mapping is not provided in the jsToSql object.
     */
    test('uses original column name if not in jsToSql', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya', unknownField: 'value' },
            { firstName: 'first_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "unknownField"=$2',
            values: ['Aliya', 'value'],
        });
    });

    /**
     * Check that the order of the fields in the SQL update statement matches
     * the order they were provided in the input object.
     */
    test('preserves order of fields', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya', age: 32, lastName: 'Smith' },
            { firstName: 'first_name', age: 'age', lastName: 'last_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2, "last_name"=$3',
            values: ['Aliya', 32, 'Smith'],
        });
    });

    /**
     * Confirms that when the jsToSql object is empty, the function uses
     * the key names as column names in the SQL update statement.
     */
    test('handles empty jsToSql object', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya', age: 32 },
            {}
        );
        expect(result).toEqual({
            setCols: '"firstName"=$1, "age"=$2',
            values: ['Aliya', 32],
        });
    });

    /**
     * Ensure sqlForPartialUpdate properly processes nested objects
     * and converts them into the correct SQL update statement.
     */
    test('works with nested objects', () => {
        const result = sqlForPartialUpdate(
            { address:
                { street: '123 Main St', city: 'Anytown' }
            },
            { 'address.street': 'address_street', 'address.city': 'address_city' }
        );
        expect(result).toEqual({
            setCols: '"address_street"=$1, "address_city"=$2',
            values: ['123 Main St', 'Anytown'],
        });
    });

    /**
     * Validates that sqlForPartialUpdate ignores properties that have
     * undefined values when creating the SQL update statement.
     */
    test('ignores undefined values', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya', middleName: undefined, lastName: 'Smith' },
            { firstName: 'first_name', middleName: 'middle_name', lastName: 'last_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2',
            values: ['Aliya', 'Smith'],
        });
    });

    /**
     * Tests sqlForPartialUpdate's ability to handle null values,
     * ensuring they are correctly added to the SQL update statement.
     */
    test('handles null values', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Aliya', middleName: null, lastName: 'Smith' },
            { firstName: 'first_name', middleName: 'middle_name', lastName: 'last_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "middle_name"=$2, "last_name"=$3',
            values: ['Aliya', null, 'Smith'],
        });
    });

    /**
     * Validate sqlForPartialUpdate correctly handles objects with numeric keys
     * and includes them in the SQL update statement with the appropriate indices.
     */
    test('works with numeric keys', () => {
        const result = sqlForPartialUpdate(
            { 0: 'zero', 1: 'one', 2: 'two' },
            { 0: 'zero', 1: 'one', 2: 'two' }
        );
        expect(result).toEqual({
            setCols: '"zero"=$1, "one"=$2, "two"=$3',
            values: ['zero', 'one', 'two'],
        });
    });

    /**
     * Check if the function handles fields with empty string values
     * and still includes them correctly in the SQL update statement.
     */
    test('handles empty string values', () => {
        const result = sqlForPartialUpdate(
            { firstName: '', lastName: 'Smith' },
            { firstName: 'first_name', lastName: 'last_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2',
            values: ['', 'Smith'],
        });
    });

    /**
     * Ensure sqlForPartialUpdate can manage fields with boolean values,
     * updating the SQL statement with correct true/false representations.
     */
    test('works with boolean values', () => {
        const result = sqlForPartialUpdate(
            { isActive: true, isAdmin: false },
            { isActive: 'is_active', isAdmin: 'is_admin' }
        );
        expect(result).toEqual({
            setCols: '"is_active"=$1, "is_admin"=$2',
            values: [true, false],
        });
    });

    /**
     * Confirm that the function correctly handles date objects,
     * incorporating date instances correctly into the SQL update statement.
     */
    test('handles date objects', () => {
        const date = new Date();
        const result = sqlForPartialUpdate(
            { birthDate: date },
            { birthDate: 'birth_date' }
        );
        expect(result).toEqual({
            setCols: '"birth_date"=$1',
            values: [date],
        });
    });

    /**
     * Test whether sqlForPartialUpdate correctly handles array values,
     * converting them to the appropriate representation in the SQL statement.
     */
    test('works with array values', () => {
        const result = sqlForPartialUpdate(
            { hobbies: ['reading', 'swimming', 'coding'] },
            { hobbies: 'hobbies' }
        );
        expect(result).toEqual({
            setCols: '"hobbies"=$1',
            values: [['reading', 'swimming', 'coding']],
        });
    });

    /**
     * Verify sqlForPartialUpdate's capability to manage object values,
     * ensuring they are included correctly in the SQL update statement.
     */
    test('handles object values', () => {
        const obj = { key: 'value' };
        const result = sqlForPartialUpdate(
            { metadata: obj },
            { metadata: 'metadata' }
        );
        expect(result).toEqual({
            setCols: '"metadata"=$1',
            values: [obj],
        });
    });
});