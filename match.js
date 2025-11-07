// =======================
// Form Submission Handler
// =======================
const form = document.getElementById('dreamForm');
const resultsSection = document.getElementById('results-section');
const resultsContainer = document.getElementById('opportunities-container');
const resultsTitle = document.getElementById('results-title');
const cardTemplate = document.getElementById('opportunity-template');


form.addEventListener('submit', async function(e) {
  e.preventDefault(); // Prevent page reload

  // --- START: VALIDATION ---
  const preferredCountries = document.getElementById("country");
  const languages = document.getElementById("languages");

  if (!preferredCountries.value || preferredCountries.selectedOptions.length === 0) {
    alert("Please select at least one Preferred Country.");
    preferredCountries.closest('.choices').querySelector('input').focus();
    return;
  }

  if (!languages.value || languages.selectedOptions.length === 0) {
    alert("Please select at least one Language Known.");
    languages.closest('.choices').querySelector('input').focus();
    return;
  }
  // --- END: VALIDATION ---


  const findButton = document.getElementById('find-matches');
  findButton.textContent = 'Saving Profile...';
  findButton.disabled = true;

  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    if (key.endsWith('[]')) {
      if (!data[key]) data[key] = [];
      data[key].push(value);
    } else {
      data[key] = value;
    }
  });

  try {
    // Step 1: Save the user's profile to the database
    const profileResponse = await fetch('http://localhost:3000/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      throw new Error(errorData.message || 'Failed to save your profile. Please try again.');
    }
    console.log("Profile Saved Successfully");


    // Step 2: Now that the profile is saved, ask for recommendations
    findButton.textContent = 'Finding Matches...';
    const recommendResponse = await fetch('http://localhost:3000/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!recommendResponse.ok) throw new Error('Failed to get recommendations.');
    
    const matches = await recommendResponse.json();
    console.log("Received Matches:", matches);

    // --- NEW: Display the results on the page ---
    displayMatchedOpportunities(matches);


  } catch (error) {
    console.error("Error in the matching process:", error);
    alert(error.message);
  } finally {
    findButton.textContent = 'Find My Perfect Matches';
    findButton.disabled = false;
  }
});


// =====================================================================
// NEW: Function to display cards (adapted from opportunities.js)
// =====================================================================
function displayMatchedOpportunities(opportunities) {
    resultsContainer.innerHTML = ''; // Clear previous results
    
    // Update and show the results section
    resultsTitle.textContent = `Found ${opportunities.length} matching opportunities for you`;
    resultsSection.style.display = 'block';

    if (opportunities.length === 0) {
        resultsContainer.innerHTML = '<p style="color: white; text-align: center; width: 100%; padding: 20px;">No opportunities match your profile. Try broadening your criteria.</p>';
        return;
    }

    opportunities.forEach(item => {
        const clone = cardTemplate.content.cloneNode(true);
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
        resultsContainer.appendChild(card);
    });

    // Scroll down to the results for a better user experience
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}


// =====================================================================
// ALL THE HELPER FUNCTIONS FOR THE FORM (No changes needed below here)
// =====================================================================
let degreeCount = 1;
function addDegree(){degreeCount++;const container=document.getElementById("degree-list");const degreeBlock=document.createElement("div");degreeBlock.classList.add("degree-block");degreeBlock.innerHTML=`<h4>📘 Degree ${degreeCount}</h4><button type="button" class="delete-degree">×</button><label><i class="fas fa-graduation-cap"></i> Degree Level *</label><select name="degree-level[]" required><option value="">Select degree</option><option value="highschool">High School / Secondary</option><option value="bachelors">Bachelor’s</option><option value="masters">Master’s</option><option value="phd">PhD</option><option value="other">Other</option></select><label><i class="fas fa-book"></i> Field of Study *</label><input type="text" name="field[]" placeholder="e.g., Computer Science" required><label><i class="fas fa-user-graduate"></i> Status *</label><select name="degree-status[]" onchange="toggleStatusFields(this)" required><option value="">Select status</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="incomplete">Dropped / Incomplete</option></select><div class="expected-year hidden"><label><i class="fas fa-calendar-check"></i> Expected Completion Year *</label><input type="number" name="expected-year[]" min="2024" max="2100"></div><div class="completion-year hidden"><label><i class="fas fa-calendar-check"></i> Year of Completion *</label><input type="number" name="completed-year[]" min="1950" max="2100"></div><div class="attended-years hidden"><label><i class="fas fa-calendar"></i> Years Attended *</label><input type="text" name="attended[]" placeholder="e.g., 2019 – 2021"></div><label><i class="fas fa-chart-line"></i> GPA / Percentage *</label><input type="text" name="gpa[]" placeholder="e.g., 3.5 / 4.0 or 85%" required>`;container.appendChild(degreeBlock);const deleteBtn=degreeBlock.querySelector(".delete-degree");deleteBtn.addEventListener("click",()=>degreeBlock.remove());const statusSelect=degreeBlock.querySelector("select[name='degree-status[]']");statusSelect.addEventListener("change",function(){toggleStatusFields(this)})}
function toggleStatusFields(select){const block=select.closest(".degree-block");const expected=block.querySelector(".expected-year");const completed=block.querySelector(".completion-year");const attended=block.querySelector(".attended-years");expected.classList.add("hidden");completed.classList.add("hidden");attended.classList.add("hidden");if(select.value==="ongoing")expected.classList.remove("hidden");else if(select.value==="completed")completed.classList.remove("hidden");else if(select.value==="incomplete")attended.classList.remove("hidden")}
function addTest(){const container=document.getElementById("test-list");const testBlock=document.createElement("div");testBlock.classList.add("test-block");testBlock.innerHTML=`<label><i class="fas fa-file-alt"></i> Test *</label><select name="test-name[]" required><option value="">Select test</option><option value="ielts">IELTS</option><option value="toefl">TOEFL</option><option value="pte">PTE</option><option value="gre">GRE</option><option value="gmat">GMAT</option><option value="sat">SAT</option><option value="act">ACT</option><option value="other">Other</option></select><label><i class="fas fa-star"></i> Score *</label><input type="text" name="test-score[]" placeholder="e.g., 7.5 / 9 or 320" required><button type="button" class="delete-test">×</button>`;container.appendChild(testBlock);const deleteBtn=testBlock.querySelector(".delete-test");deleteBtn.addEventListener("click",()=>testBlock.remove())}
async function loadCountries(){const countryApiUrl='https://restcountries.com/v3.1/all?fields=name';const fallbackCountries=["India","United States","United Kingdom","Canada","Germany","Australia"];try{const response=await fetch(countryApiUrl);if(!response.ok){throw new Error('Failed to fetch countries from API')}
const data=await response.json();const countries=data.map(country=>country.name.common).sort();populateCountries(countries)}catch(error){console.warn("API for countries failed, using a fallback list:",error);populateCountries(fallbackCountries)}}
function populateCountries(countries){const nationalitySelect=document.getElementById("nationality");const countrySelect=document.getElementById("country");countries.forEach(country=>{const option1=document.createElement("option");option1.value=country;option1.textContent=country;nationalitySelect.appendChild(option1);const option2=document.createElement("option");option2.value=country;option2.textContent=country;countrySelect.appendChild(option2)});new Choices(nationalitySelect,{searchEnabled:true,removeItemButton:false,placeholder:true,placeholderValue:"Select nationality"});new Choices(countrySelect,{removeItemButton:true,placeholder:true,placeholderValue:"Select preferred countries"})}
function loadLanguages(){const languages=["English","Hindi","Marathi","Spanish","French","German","Mandarin","Japanese","Arabic","Russian","Portuguese","Italian"];const langSelect=document.getElementById("languages");languages.forEach(lang=>{const opt=document.createElement("option");opt.value=lang;opt.textContent=lang;langSelect.appendChild(opt)});new Choices(langSelect,{removeItemButton:true,placeholder:true,placeholderValue:"Select or type languages",addItems:true})}
document.addEventListener("DOMContentLoaded",()=>{const firstTestDelete=document.querySelector("#test-list .delete-test");if(firstTestDelete){firstTestDelete.addEventListener("click",function(){this.closest(".test-block").remove()})}
const initialStatus=document.querySelector("div.degree-block:first-of-type select[name='degree-status[]']");if(initialStatus){toggleStatusFields(initialStatus)}
loadCountries();loadLanguages()});

