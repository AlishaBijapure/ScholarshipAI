document.addEventListener('DOMContentLoaded', () => {
    const opportunitiesContainer = document.getElementById('opportunities-container');
    const template = document.getElementById('opportunity-template');
    const loadingMessage = document.getElementById('loading-message');
    
    const searchBar = document.getElementById('search-bar');
    const typeFilter = document.getElementById('type-filter');
    const countryFilter = document.getElementById('country-filter');
    const fieldFilter = document.getElementById('field-filter');
    const resetBtn = document.getElementById('reset-filters');

    let allOpportunities = [];

    // --- 1. FETCH OPPORTUNITIES FROM YOUR BACKEND ---
    async function fetchOpportunities() {
        try {
            // This URL must match where your backend server is running
            const response = await fetch('http://localhost:3000/api/scholarships');
            if (!response.ok) throw new Error('Network response was not ok');
            allOpportunities = await response.json();
            
            if (allOpportunities.length > 0) {
                loadingMessage.style.display = 'none';
                populateFieldFilter(allOpportunities);
                displayOpportunities(allOpportunities);
            } else {
                loadingMessage.textContent = 'No opportunities found. Add some via the Submit page!';
            }

        } catch (error) {
            console.error('Failed to fetch opportunities:', error);
            loadingMessage.textContent = 'Failed to load opportunities. Please make sure your backend server is running.';
        }
    }

    // --- 2. DISPLAY OPPORTUNITIES ---
    function displayOpportunities(opportunities) {
        opportunitiesContainer.innerHTML = ''; 
        if (opportunities.length === 0) {
            opportunitiesContainer.innerHTML = '<p style="color: white; text-align: center; width: 100%;">No opportunities match your criteria.</p>';
            return;
        }

        opportunities.forEach(item => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.opportunity-card');
            card.classList.add(item.type.toLowerCase()); 
            card.querySelector('.badge').textContent = item.type;
            card.querySelector('.card-title').textContent = item.title;
            card.querySelector('.card-about').textContent = item.about;
            const statusElement = card.querySelector('.card-status');
            statusElement.innerHTML = `<i class="fas fa-circle" style="color:${item.status === 'Open' ? '#2ecc71' : '#e74c3c'}"></i> Status: ${item.status}`;
            card.querySelector('.card-location').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${item.location}`;
            card.querySelector('.card-fields').innerHTML = `<i class="fas fa-book"></i> Fields: ${item.fieldOfStudy.join(', ')}`;
            const deadline = item.deadline ? new Date(item.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not specified';
            card.querySelector('.card-deadline').innerHTML = `<i class="fas fa-hourglass-half"></i> Deadline: ${deadline}`;
            card.querySelector('.card-eligibility').innerHTML = `<i class="fas fa-user-check"></i> Eligibility: ${item.eligibilitySummary}`;
            const awardElement = card.querySelector('.card-award');
            if (item.fundingAmount) {
                awardElement.innerHTML = `<i class="fas fa-dollar-sign"></i> Award: ${item.fundingAmount}`;
                awardElement.style.display = 'flex';
            } else if (item.companyName) {
                awardElement.innerHTML = `<i class="fas fa-building"></i> Company: ${item.companyName}`;
                awardElement.style.display = 'flex';
            }
            card.querySelector('.btn-primary').href = item.link;
            opportunitiesContainer.appendChild(card);
        });
    }

    // --- 3. POPULATE FILTERS DYNAMICALLY ---
    async function loadAllCountriesForFilter() {
        const countryApiUrl = 'https://restcountries.com/v3.1/all?fields=name';
        try {
            const response = await fetch(countryApiUrl);
            if (!response.ok) throw new Error('Failed to fetch countries');
            const data = await response.json();
            const countries = data.map(country => country.name.common).sort();
            
            // This now populates a standard dropdown, not a Choices.js one
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilter.appendChild(option);
            });
        } catch (error) {
            console.warn("Could not load full country list for filter:", error);
        }
    }
    
    function populateFieldFilter(opportunities) {
        const curatedFields = ["All subjects are eligible", "Engineering", "Computer Science & IT", "Business & Finance", "Health & Medicine", "Arts & Humanities", "Social Sciences", "Natural Sciences", "Law", "Education"];
        const dbFields = [...new Set(opportunities.flatMap(op => op.fieldOfStudy))];
        const fieldsToShow = curatedFields.filter(category => {
            if (category === "All subjects are eligible") return dbFields.includes(category);
            return dbFields.some(dbField => dbField.toLowerCase().includes(category.split(' ')[0].toLowerCase()));
        });
        if (dbFields.includes("All subjects are eligible") && !fieldsToShow.includes("All subjects are eligible")) {
            fieldsToShow.unshift("All subjects are eligible");
        }
        // This now populates a standard dropdown
        fieldFilter.innerHTML = '<option value="">All Fields</option>';
        fieldsToShow.sort().forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.textContent = field;
            fieldFilter.appendChild(option);
        });
    }
    
    // --- 4. FILTERING LOGIC ---
    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        const selectedType = typeFilter.value;
        const selectedCountry = countryFilter.value;
        const selectedField = fieldFilter.value;

        const filtered = allOpportunities.filter(op => {
            const matchesType = selectedType === '' || op.type === selectedType;
            
            const dbCountries = op.country.split(',').map(c => c.trim());
            const matchesCountryFilter = selectedCountry === '' || dbCountries.includes(selectedCountry);

            const matchesField = selectedField === '' || op.fieldOfStudy.includes(selectedField) || (selectedField !== "All subjects are eligible" && op.fieldOfStudy.some(field => field.toLowerCase().includes(selectedField.split(' ')[0].toLowerCase())));

            if (searchTerm === '') return matchesType && matchesCountryFilter && matchesField;
            
            // --- Simplified Search Logic (No Aliases) ---
            const matchesSearch =
                op.title.toLowerCase().includes(searchTerm) ||
                op.about.toLowerCase().includes(searchTerm) ||
                op.location.toLowerCase().includes(searchTerm) ||
                (op.companyName && op.companyName.toLowerCase().includes(searchTerm)) ||
                // Directly check against the countries listed in the database
                dbCountries.some(c => c.toLowerCase().includes(searchTerm));

            return matchesType && matchesCountryFilter && matchesField && matchesSearch;
        });
        displayOpportunities(filtered);
    }

    // --- 5. EVENT LISTENERS ---
    searchBar.addEventListener('input', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    countryFilter.addEventListener('change', applyFilters);
    fieldFilter.addEventListener('change', applyFilters);
    
    resetBtn.addEventListener('click', () => {
        searchBar.value = '';
        typeFilter.value = '';
        countryFilter.value = '';
        fieldFilter.value = '';
        applyFilters(); 
    });

    // --- INITIALIZE ---
    fetchOpportunities();
    loadAllCountriesForFilter();
});

