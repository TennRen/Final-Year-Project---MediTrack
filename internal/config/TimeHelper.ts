
export class TimeHelper{

    public static MINIMUM_MINUTES = 3;

    public static Days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    public static Months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    public static readonly ONE_MINUTE = 60 * 1000;

    public static minutesFromNow(minutes:number){
        if (minutes < TimeHelper.MINIMUM_MINUTES) minutes = TimeHelper.MINIMUM_MINUTES;
        return new Date( Date.now() + (minutes * TimeHelper.ONE_MINUTE) );
    }

    public static millisecondsFromNow(date:Date){
        return (date.getTime() - Date.now());
    }

    public static secondsFromNow(date:Date){
        return this.millisecondsFromNow(date) / 1000;
    }

    public static getPositional(date:number){
        let dString = date.toString();
        if (dString.length > 1) date = Number( dString[dString.length - 1] );
        if (date === 1) return "st";
        if (date === 2) return "nd";
        if (date === 3) return "rd";
        return "th";
    }

    public static toFriendlyTime(date:Date){
        let hrs =  date.getHours() > 12 ?  date.getHours() - 12 :  date.getHours();
        return [
            hrs,
            ":",
            date.getUTCMinutes().toString().padStart(2, "0"),
            date.getHours() > 12 ? "am" : "pm"
        ].join("")
    }

    public static toFriendlyDate(date:Date, withDate:boolean=false){
        return [
            this.Days[date.getUTCDay()],
            date.getUTCDate() + this.getPositional(date.getUTCDate()),
            this.Months[date.getUTCMonth()],
            date.getUTCFullYear()
        ].join(" ") + (withDate ? " at " + this.toFriendlyTime(date) : "");
    }

    public static toHumanDate(date:Date){
        let delta = Math.round((+new Date - date.getTime()) / 1000);

        let minute = 60,
            hour = minute * 60,
            day = hour * 24;

        let when:string;

        if (delta < 10) when = 'Just now';
        else if (delta < minute) when = delta + ' seconds ago';
        else if (delta < 2 * minute) when = "A minute ago"
        else if (delta < hour) when = Math.floor(delta / minute) + ' minutes ago';
        else if (Math.floor(delta / hour) == 1) when = "An hour ago";
        else if (delta < day) when = Math.floor(delta / hour) + ' hours ago.';
        else if (delta < day * 2) when = "Yesterday at " + this.toFriendlyTime(date);
        else when = `${date.getUTCDate().toString().padStart(2,"0")}/${(date.getUTCMonth() + 1).toString().padStart(2, "0")}/${date.getUTCFullYear()} at ` + this.toFriendlyTime(date);
        return when;
    }

    public static isAtLeastNextDay(earlier:Date, later:Date){
        return Number(
            earlier.getUTCFullYear().toString() +
            earlier.getUTCMonth().toString().padStart(2, "0") +
            earlier.getUTCDate().toString().padStart(2, "0")
        ) < Number(
            later.getUTCFullYear().toString() +
            later.getUTCMonth().toString().padStart(2, "0") +
            later.getUTCDate().toString().padStart(2, "0")
        )
    }
}