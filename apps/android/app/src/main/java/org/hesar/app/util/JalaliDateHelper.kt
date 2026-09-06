package org.hesar.app.util

import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

object JalaliDateHelper {

    private val PERSIAN_MONTHS = listOf(
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    )

    data class JalaliDate(
        val year: Int,
        val month: Int, // 1 to 12
        val day: Int
    ) {
        val monthName: String
            get() = PERSIAN_MONTHS.getOrElse(month - 1) { "" }

        fun formatNumeric(toPersianDigits: Boolean = true): String {
            val str = String.format("%04d/%02d/%02d", year, month, day)
            return if (toPersianDigits) toPersianDigits(str) else str
        }

        fun formatHumanReadable(toPersianDigits: Boolean = true): String {
            val str = "$day $monthName $year"
            return if (toPersianDigits) toPersianDigits(str) else str
        }
    }

    /**
     * Converts a Gregorian LocalDate to JalaliDate accurately.
     */
    fun gregorianToJalali(gregorian: LocalDate): JalaliDate {
        var gYear = gregorian.year
        val gMonth = gregorian.monthValue
        val gDay = gregorian.dayOfMonth

        val gDaysInMonth = intArrayOf(0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
        if ((gYear % 4 == 0 && gYear % 100 != 0) || (gYear % 400 == 0)) {
            gDaysInMonth[2] = 29
        }

        var gDayOfYear = 0
        for (i in 1 until gMonth) {
            gDayOfYear += gDaysInMonth[i]
        }
        gDayOfYear += gDay

        val march21GDayOfYear = if (gDaysInMonth[2] == 29) 80 else 79

        var jYear: Int
        var jDayOfYear: Int

        if (gDayOfYear > march21GDayOfYear) {
            jDayOfYear = gDayOfYear - march21GDayOfYear
            jYear = gYear - 621
        } else {
            val prevGYear = gYear - 1
            val prevIsLeap = (prevGYear % 4 == 0 && prevGYear % 100 != 0) || (prevGYear % 400 == 0)
            val prevMarch21 = if (prevIsLeap) 80 else 79
            val prevYearDays = if (prevIsLeap) 366 else 365
            jDayOfYear = gDayOfYear + (prevYearDays - prevMarch21)
            jYear = gYear - 622
        }

        var jMonth = 1
        var jDay = jDayOfYear

        if (jDayOfYear <= 186) { // First 6 months have 31 days
            jMonth = 1 + (jDayOfYear - 1) / 31
            jDay = 1 + (jDayOfYear - 1) % 31
        } else { // Next 5 months have 30 days, last has 29 or 30
            val rem = jDayOfYear - 186
            jMonth = 7 + (rem - 1) / 30
            jDay = 1 + (rem - 1) % 30
        }

        return JalaliDate(jYear, jMonth, jDay)
    }

    fun formatEpochMillisToJalali(
        epochMillis: Long,
        includeTime: Boolean = true,
        toPersianDigits: Boolean = true
    ): String {
        val ldt = LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), ZoneId.systemDefault())
        val jalali = gregorianToJalali(ldt.toLocalDate())

        val dateStr = "${jalali.day} ${jalali.monthName} ${jalali.year}"
        val result = if (includeTime) {
            val timeStr = String.format("%02d:%02d", ldt.hour, ldt.minute)
            "$timeStr — $dateStr"
        } else {
            dateStr
        }

        return if (toPersianDigits) toPersianDigits(result) else result
    }

    fun formatIsoToJalali(
        isoString: String?,
        includeTime: Boolean = false,
        toPersianDigits: Boolean = true
    ): String {
        if (isoString.isNullOrBlank()) return "—"
        return try {
            val parsed = if (isoString.length <= 10) {
                LocalDate.parse(isoString)
            } else {
                Instant.parse(isoString).atZone(ZoneId.systemDefault()).toLocalDate()
            }
            val jalali = gregorianToJalali(parsed)
            if (toPersianDigits) jalali.formatHumanReadable(true) else jalali.formatHumanReadable(false)
        } catch (_: Exception) {
            isoString
        }
    }

    /**
     * Converts ASCII digits (0-9) to Persian digits (۰-۹).
     */
    fun toPersianDigits(input: String): String {
        val persianDigits = charArrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')
        val builder = java.lang.StringBuilder(input.length)
        for (ch in input) {
            if (ch in '0'..'9') {
                builder.append(persianDigits[ch - '0'])
            } else {
                builder.append(ch)
            }
        }
        return builder.toString()
    }
}
