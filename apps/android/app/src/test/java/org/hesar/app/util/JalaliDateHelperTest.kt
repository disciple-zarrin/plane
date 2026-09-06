package org.hesar.app.util

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.LocalDate

class JalaliDateHelperTest {

    @Test
    fun `test accurate Gregorian to Jalali conversion`() {
        // 2026-09-06 is 1405-06-16 (16 Shahrivar 1405)
        val gDate = LocalDate.of(2026, 9, 6)
        val jDate = JalaliDateHelper.gregorianToJalali(gDate)

        assertEquals(1405, jDate.year)
        assertEquals(6, jDate.month)
        assertEquals(15, jDate.day)
        assertEquals("شهریور", jDate.monthName)
    }

    @Test
    fun `test Persian Nowruz transition`() {
        // 2026-03-21 is 1405-01-01 (1 Farvardin 1405)
        val gDate = LocalDate.of(2026, 3, 21)
        val jDate = JalaliDateHelper.gregorianToJalali(gDate)

        assertEquals(1405, jDate.year)
        assertEquals(1, jDate.month)
        assertEquals(1, jDate.day)
        assertEquals("فروردین", jDate.monthName)
    }

    @Test
    fun `test Persian digits formatting`() {
        val input = "2026/09/06 14:30"
        val expected = "۲۰۲۶/۰۹/۰۶ ۱۴:۳۰"
        assertEquals(expected, JalaliDateHelper.toPersianDigits(input))
    }
}
