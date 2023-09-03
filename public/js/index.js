const likeButtons = document.querySelectorAll('.like-btn');

  // Retrieve and set the initial like count for each blog button
  likeButtons.forEach(button => {
    const blogId = button.dataset.blogId;
    const storedLikeCount = sessionStorage.getItem(`likeCount_${blogId}`);
    if (storedLikeCount) {
      const clickCount = parseInt(storedLikeCount);
      if (clickCount % 2 === 1) {
        button.classList.add('odd-click');
      }
    }
  });

  likeButtons.forEach(button => {
    const blogId = button.dataset.blogId;

    button.addEventListener('click', () => {
      // Retrieve the current like count from sessionStorage
      const storedLikeCount = sessionStorage.getItem(`likeCount_${blogId}`);
      let clickCount = 0;
      if (storedLikeCount) {
        clickCount = parseInt(storedLikeCount);
      }

      clickCount++;
      sessionStorage.setItem(`likeCount_${blogId}`, clickCount);

      // Make a fetch request to the server
      fetch(`/like-blog/${blogId}`, {
        method: 'POST',
        credentials: 'include' // Include credentials (cookies) in the request
      })
        .then(response => response.json())
        .then(data => {
          // Update the like count on the frontend based on the response
          // button.textContent = `Like (${data.likeCount})`;
          if (data.action === 'liked') {
            button.classList.add('odd-click');
            button.textContent = 'Unlike';
          } else if (data.action === 'unliked') {
            button.classList.remove('odd-click');
            button.textContent = 'Like';
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    });
  });

  function convertToIST(date) {
  const ISTOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const istTime = new Date(utc + ISTOffset);
  return istTime;
}
  function displayComments(blogId) {
    fetch(`/api/comments/${blogId}`)
      .then((response) => response.json())
      .then((data) => {
        const commentsSection = document.querySelector(`.comments-section[data-blog-id="${blogId}"]`);
        commentsSection.innerHTML = '';

        data.comments.forEach((comment) => {
          const commentElement = document.createElement('div');
          const utcDate = new Date(comment.comment_date);
          const istDate = convertToIST(utcDate);
          commentElement.innerHTML = `
            <p><strong>${comment.commenter_name}</strong>: ${comment.comment_text}</p>
            <small>${istDate.toLocaleString('en-IN')}</small>
          `;
          commentsSection.appendChild(commentElement);
        });
      })
      .catch((error) => {
        console.error('Error fetching comments:', error);
      });
  }

  // Event listener for "View Comments" button
  const viewCommentsButtons = document.querySelectorAll('.view-comments-btn');
  viewCommentsButtons.forEach((button) => {
    const blogId = button.dataset.blogId;
    button.addEventListener('click', () => {
      displayComments(blogId);
    });
  });

  // Event listener for comment form submission
  const commentForms = document.querySelectorAll('.comment-form');
  commentForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const blogId = form.dataset.blogId;
      const formData = new FormData(form);
      const commenterName = formData.get('commenterName');
      const commentText = formData.get('commentText');

      fetch(`/api/comments/${blogId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commenterName,
          commentText,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          // Clear the comment form after submission
          form.reset();
          // Refresh the comments section to display the new comment
          displayComments(blogId);
        })
        .catch((error) => {
          console.error('Error submitting comment:', error);
        });
    });
  });