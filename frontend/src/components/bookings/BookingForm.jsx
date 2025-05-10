import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BookingForm({ user, rooms, onBookingCreated }) {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const twoYearsFromNow = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    
    const [room, setRoom] = useState(rooms.length > 0 ? rooms[0].name : "");
    const [startDate, setStartDate] = useState(formattedToday);
    const [endDate, setEndDate] = useState(formattedToday);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [eventName, setEventName] = useState('');
    const [frequency, setFrequency] = useState('single');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // For admin booking on behalf of users
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(user.id);
    const [selectedUserName, setSelectedUserName] = useState(user.name);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    // New state for advanced repeating options
    const [repeatInterval, setRepeatInterval] = useState(1);
    const [weekDays, setWeekDays] = useState({
        monday: false, tuesday: false, wednesday: false, thursday: false,
        friday: false, saturday: false, sunday: false
    });
    const [monthlyRepeatType, setMonthlyRepeatType] = useState('day-of-month'); // 'day-of-month' or 'day-of-week'
    const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState(today.getDate());
    const [monthlyWeekPosition, setMonthlyWeekPosition] = useState(Math.ceil(today.getDate() / 7));
    const [monthlyWeekDay, setMonthlyWeekDay] = useState(today.getDay());
    const [yearlyMonth, setYearlyMonth] = useState(today.getMonth());
    
    // Months to repeat (for yearly)
    const [selectedMonths, setSelectedMonths] = useState({
        january: false, february: false, march: false, april: false,
        may: false, june: false, july: false, august: false,
        september: false, october: false, november: false, december: false
    });
    
    // End condition options
    const [endCondition, setEndCondition] = useState('after');
    const [occurrences, setOccurrences] = useState(1);
    const [endOnDate, setEndOnDate] = useState(
        new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split('T')[0]
    );

    // Fetch all users if current user is admin
    useEffect(() => {
        if (user.role === 'admin') {
            const fetchUsers = async () => {
                try {
                    setLoadingUsers(true);
                    const token = localStorage.getItem('token');
                    
                    const response = await axios.get('http://localhost:5000/api/users', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    setUsers(response.data);
                } catch (error) {
                    console.error('Error fetching users:', error);
                    setError('Failed to load users. You may not be able to book on behalf of users.');
                } finally {
                    setLoadingUsers(false);
                }
            };
            
            fetchUsers();
        }
    }, [user.role]);
    
    // Handle user selection change
    const handleUserChange = (e) => {
        const userId = e.target.value;
        const selectedUser = users.find(u => u.id === userId);
        
        if (selectedUser) {
            setSelectedUserId(selectedUser.id);
            setSelectedUserName(selectedUser.name);
        } else {
            setSelectedUserId(user.id);
            setSelectedUserName(user.name);
        }
    };
    
    // Generate time slots (6:00 AM to 12:00 AM in 30-minute increments)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 22; hour++) {
            const hourFormatted = hour.toString().padStart(2, '0');
            slots.push(`${hourFormatted}:00`);
            slots.push(`${hourFormatted}:30`);
        }
        slots.push('23:00');
        return slots;
    };
    
    const timeSlots = generateTimeSlots();
    
    // Generate numbers 1-31 for day of month selection
    const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // Day position options (1st, 2nd, 3rd, 4th, last)
    const weekPositions = [
        { value: 1, label: '1st' },
        { value: 2, label: '2nd' },
        { value: 3, label: '3rd' },
        { value: 4, label: '4th' },
        { value: -1, label: 'Last' }
    ];
    
    // Weekday options
    const weekdayOptions = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];
    
    // Month options
    const monthOptions = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' }
    ];
    
    // Handle toggling weekdays for weekly repeats
    const handleWeekDayToggle = (day) => {
        setWeekDays(prev => ({
            ...prev,
            [day]: !prev[day]
        }));
    };
    
    // Handle toggling months for yearly repeats
    const handleMonthToggle = (month) => {
        setSelectedMonths(prev => ({
            ...prev,
            [month]: !prev[month]
        }));
    };

    // Set default selected weekday for weekly repeats to match start date's day
    useEffect(() => {
        if (frequency === 'weekly' && startDate) {
            const dateObj = new Date(startDate);
            const jsDay = dateObj.getDay(); // 0 (Sun) - 6 (Sat)
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            setWeekDays(prev => {
                // Only set if none selected
                if (Object.values(prev).every(v => !v)) {
                    const newWeekDays = {};
                    dayNames.forEach((d, i) => { newWeekDays[d] = i === jsDay; });
                    return newWeekDays;
                }
                return prev;
            });
        }
    }, [frequency, startDate]);

    // Prepare repeat configuration for API submission
    const prepareRepeatConfig = () => {
        if (frequency === 'single') {
            return null;
        }
        
        const config = {
            repeatType: frequency,
            repeatInterval: repeatInterval,
            repeatOn: null,
            endsAfter: endCondition === 'after' ? occurrences : null,
            endsOn: endCondition === 'on-date' ? endOnDate : null
        };
        
        // Set repeatOn based on frequency type
        switch (frequency) {
            case 'weekly':
                config.repeatOn = Object.keys(weekDays).filter(day => weekDays[day]);
                break;
            case 'monthly':
                if (monthlyRepeatType === 'day-of-month') {
                    config.repeatOn = { type: 'day-of-month', day: monthlyDayOfMonth };
                } else {
                    config.repeatOn = { 
                        type: 'day-of-week', 
                        position: monthlyWeekPosition, 
                        day: monthlyWeekDay 
                    };
                }
                break;
            case 'yearly':
                config.repeatOn = {
                    months: Object.keys(selectedMonths)
                        .filter(month => selectedMonths[month])
                        .map(month => monthOptions.findIndex(m => m.label.toLowerCase() === month)),
                    day: monthlyDayOfMonth
                };
                break;
            default:
                break;
        }
        
        return config;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
          // Prepare data for API
          const bookingData = {
            room: selectedRoom,
            startDateTime: formatDateTimeForAPI(startDate, startTime),
            endDateTime: formatDateTimeForAPI(endDate, endTime),
            eventName: eventName,
            frequency: frequency,
            userId: user.id,
            userName: user.username
          };
          
          // Add repeat configuration if this is a recurring booking
          if (frequency !== 'single') {
            const repeatConfig = {
              repeatType: frequency,
              repeatInterval: repeatInterval,
              repeatOn: prepareRepeatOn(),
              endsAfter: endOption === 'after' ? parseInt(endsAfterCount) : null,
              endsOn: endOption === 'on' ? formatDateForAPI(endsOnDate) : null
            };
            
            bookingData.repeatConfig = repeatConfig;
            
            // Log what we're sending to help debug
            console.log("Sending booking data:", JSON.stringify(bookingData, null, 2));
          }
          
          // Make the API request
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(bookingData)
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Failed to create booking');
          }
          
          // Reset form and show success message
          resetForm();
          setNotification({ type: 'success', message: 'Booking created successfully' });
          
          // Make sure we check if data.booking exists before accessing properties
          if (data.booking && onBookingCreated) {
            onBookingCreated(data.booking);
          } else if (data.bookings && data.bookings.length > 0 && onBookingCreated) {
            // If we have multiple bookings, pass the first one to maintain compatibility
            onBookingCreated(data.bookings[0]);
          }
          
        } catch (error) {
          console.error('Booking error:', error);
          setNotification({ type: 'error', message: error.message });
        } finally {
          setSubmitting(false);
        }
      };
      
      // Helper function for preparing repeat configuration based on frequency
      const prepareRepeatOn = () => {
        switch (frequency) {
          case 'weekly':
            // Make sure selectedDays is an array of day names
            return selectedDays || ['saturday']; // Default to Saturday if not set
            
          case 'monthly':
            if (monthlyOption === 'dayOfMonth') {
              return { type: 'day-of-month', day: parseInt(dayOfMonth) };
            } else {
              return { 
                type: 'day-of-week', 
                position: parseInt(weekOfMonth), 
                day: getDayNumberFromName(dayOfWeek) 
              };
            }
            
          case 'yearly':
            return { 
              months: selectedMonths, 
              day: parseInt(dayOfMonth) 
            };
            
          default:
            return null;
        }
      };
    
    // Reset form function
    const resetForm = () => {
        setEventName('');
        setStartTime('09:00');
        setEndTime('10:00');
        setEndDate(formattedToday);
        setFrequency('single');
        setRepeatInterval(1);
        setWeekDays({
            monday: false, tuesday: false, wednesday: false, thursday: false,
            friday: false, saturday: false, sunday: false
        });
        setMonthlyRepeatType('day-of-month');
        setMonthlyDayOfMonth(today.getDate());
        setMonthlyWeekPosition(Math.ceil(today.getDate() / 7));
        setMonthlyWeekDay(today.getDay());
        setSelectedMonths({
            january: false, february: false, march: false, april: false,
            may: false, june: false, july: false, august: false,
            september: false, october: false, november: false, december: false
        });
        setEndCondition('no-end');
        setOccurrences(10);
        setEndOnDate(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split('T')[0]);
    };
    
    // Render repeating options based on frequency
    const renderFrequencyOptions = () => {
        if (frequency === 'single') {
            return null;
        }
        
        return (
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-md font-medium mb-3 text-gray-700">Repeating Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Repeat Interval */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repeat every
                        </label>
                        <div className="flex items-center">
                            <input
                                type="number"
                                min="1"
                                max="99"
                                className="w-20 p-2 border border-gray-300 rounded-md mr-2"
                                value={repeatInterval}
                                onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                            />
                            <span>
                                {frequency === 'daily' ? 'day(s)' : 
                                 frequency === 'weekly' ? 'week(s)' : 
                                 frequency === 'monthly' ? 'month(s)' : 'year(s)'}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Weekly options */}
                {frequency === 'weekly' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Repeat on
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={`px-2 py-1 rounded text-sm ${weekDays.sunday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleWeekDayToggle('sunday')}
                            >
                                Sun
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded text-sm ${weekDays.monday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleWeekDayToggle('monday')}
                            >
                                Mon
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded text-sm ${weekDays.tuesday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleWeekDayToggle('tuesday')}
                            >
                                Tue
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded text-sm ${weekDays.wednesday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleWeekDayToggle('wednesday')}
                            >
                                Wed
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded text-sm ${weekDays.thursday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleWeekDayToggle('thursday')}
                            >
                                Thu
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded text-sm ${weekDays.friday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleWeekDayToggle('friday')}
                            >
                                Fri
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded text-sm ${weekDays.saturday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleWeekDayToggle('saturday')}
                            >
                                Sat
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Monthly options */}
                {frequency === 'monthly' && (
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <input
                                type="radio"
                                id="dayOfMonth"
                                className="mr-2"
                                checked={monthlyRepeatType === 'day-of-month'}
                                onChange={() => setMonthlyRepeatType('day-of-month')}
                            />
                            <label htmlFor="dayOfMonth" className="text-sm text-gray-700">
                                On day
                            </label>
                            <select
                                className="ml-2 p-1 border border-gray-300 rounded-md"
                                value={monthlyDayOfMonth}
                                onChange={(e) => setMonthlyDayOfMonth(parseInt(e.target.value))}
                                disabled={monthlyRepeatType !== 'day-of-month'}
                            >
                                {daysInMonth.map(day => (
                                    <option key={`day-${day}`} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="dayOfWeek"
                                className="mr-2"
                                checked={monthlyRepeatType === 'day-of-week'}
                                onChange={() => setMonthlyRepeatType('day-of-week')}
                            />
                            <label htmlFor="dayOfWeek" className="text-sm text-gray-700">
                                On the
                            </label>
                            <select
                                className="ml-2 p-1 border border-gray-300 rounded-md"
                                value={monthlyWeekPosition}
                                onChange={(e) => setMonthlyWeekPosition(parseInt(e.target.value))}
                                disabled={monthlyRepeatType !== 'day-of-week'}
                            >
                                {weekPositions.map(pos => (
                                    <option key={`pos-${pos.value}`} value={pos.value}>{pos.label}</option>
                                ))}
                            </select>
                            <select
                                className="ml-2 p-1 border border-gray-300 rounded-md"
                                value={monthlyWeekDay}
                                onChange={(e) => setMonthlyWeekDay(parseInt(e.target.value))}
                                disabled={monthlyRepeatType !== 'day-of-week'}
                            >
                                {weekdayOptions.map(day => (
                                    <option key={`weekday-${day.value}`} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
                
                {/* Yearly options */}
                {frequency === 'yearly' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Repeat in these months
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                            {monthOptions.map(month => (
                                <button
                                    key={`month-${month.value}`}
                                    type="button"
                                    className={`px-2 py-1 rounded text-sm 
                                        ${selectedMonths[month.label.toLowerCase()] 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200'}`}
                                    onClick={() => handleMonthToggle(month.label.toLowerCase())}
                                >
                                    {month.label}
                                </button>
                            ))}
                        </div>
                        
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            On day
                        </label>
                        <select
                            className="p-1 border border-gray-300 rounded-md"
                            value={monthlyDayOfMonth}
                            onChange={(e) => setMonthlyDayOfMonth(parseInt(e.target.value))}
                        >
                            {daysInMonth.map(day => (
                                <option key={`yday-${day}`} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {/* End condition options */}
                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        End
                    </label>
                    
                    
                    
                    <div className="flex items-center mb-2">
                        <input
                            type="radio"
                            id="afterOccurrences"
                            className="mr-2"
                            checked={endCondition === 'after'}
                            onChange={() => setEndCondition('after')}
                        />
                        <label htmlFor="afterOccurrences" className="text-sm text-gray-700">
                            End after
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="ml-2 w-20 p-1 border border-gray-300 rounded-md"
                            value={occurrences}
                            onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
                            disabled={endCondition !== 'after'}
                        />
                        <span className="ml-1 text-sm text-gray-700">occurrences. (inclusive of current selection)</span>
                    </div>
                    
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="endOnDate"
                            className="mr-2"
                            checked={endCondition === 'on-date'}
                            onChange={() => setEndCondition('on-date')}
                        />
                        <label htmlFor="endOnDate" className="text-sm text-gray-700">
                            End on
                        </label>
                        <input
                            type="date"
                            className="ml-2 p-1 border border-gray-300 rounded-md"
                            value={endOnDate}
                            onChange={(e) => setEndOnDate(e.target.value)}
                            min={formattedToday}
                            max={twoYearsFromNow}
                            disabled={endCondition !== 'on-date'}
                        />
                    </div>

                    <div className="flex items-center mb-2">
                        <input
                            type="radio"
                            id="noEnd"
                            className="mr-2"
                            checked={endCondition === 'no-end'}
                            onChange={() => setEndCondition('no-end')}
                        />
                        <label htmlFor="noEnd" className="text-sm text-gray-700 relative group">
                            No end date
                            <span className="ml-2 text-gray-400 cursor-pointer" tabIndex={0}>
                                &#9432;
                                <span className="hidden group-hover:block mt-3 group-focus:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg absolute z-10 -left-16 -bottom-8 whitespace-nowrap">
                                    Recurring bookings with no end date are capped at 2 years.
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Create Booking
            </h2>
            
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="p-3 bg-green-50 text-green-600 text-sm rounded border border-green-200">
                    {success}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User selection dropdown for admins only */}
                {user.role === 'admin' && (
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Book for User *</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedUserId}
                            onChange={handleUserChange}
                            disabled={loadingUsers}
                            required
                        >
                            {loadingUsers ? (
                                <option>Loading users...</option>
                            ) : (
                                <>
                                    <option value={user.id}>{user.name} (You)</option>
                                    {users
                                        .filter(u => u.id !== user.id) // Filter out the current admin
                                        .map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.username})
                                            </option>
                                        ))
                                    }
                                </>
                            )}
                        </select>
                    </div>
                )}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                    <input
                        type="text"
                        placeholder="Enter event name"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                    />

                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        required
                    >
                        {rooms.map(room => (
                            <option key={room.id} value={room.name}>{room.name}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                    >
                        <option value="single">Single Use</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            if (endDate < e.target.value) setEndDate(e.target.value);
                        }}
                        min={formattedToday}
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={startTime}
                        onChange={(e) => {
                            setStartTime(e.target.value);
                            if (endTime <= e.target.value) setEndTime(e.target.value);
                        }}
                        
                        required
                    >
                        {timeSlots.map(time => (
                            <option key={`start-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={endTime}
                        onChange={(e) => {
                            setEndTime(e.target.value);
                            if (startTime >= e.target.value) setStartTime(e.target.value);
                        }}
                        required
                    >
                        {timeSlots.map(time => (
                            <option key={`end-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                
            </div>
            
            {/* Render additional options based on frequency */}
            {renderFrequencyOptions()}
            
            <div className="pt-4">
                <button
                    type="submit"
                    className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Submitting...' : user.role === 'admin' ? 'Create Booking' : 'Submit Booking Request'}
                </button>
            </div>
        </form>
    );
}