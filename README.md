# placeWeekly

PlaceWeekly is a clone of Original Place with all the features packed. It has 1000x1000 Canvas without performance drop and realtime collaboration. We host PlaceWeekly once in a week for 24 hours which is available for everyone.

Join Placeweekly: https://placeweekly.netilify.app

# How does this work?

PlaceWeekly is written in React following the technology used in original Place.

## The canvas

It uses a 1000x1000 pixels `canvas` element to render tiles. The backend is Firebase Realtime DB which allows realtime collaboration. As it's maintained by Google, the performance is satisfying.

## Rendering Complete Image

The canvas by default applies blur effect on the image rendered. This makes the complete image bad in quality and you see and edit individual pixel. To solve this issue, the CSS pixelated filter is used.

## Scaling

CSS Scale is behind the functionality of scaling canvas. CSS scale is fast and smooth and perfect for this task.

## Updating Tiles

Detecting user click and updating specific pixel in canvas requires some simple math. As the pixels are not individual DOM element, you can't track each pixel individually. Rather, you need to track the coordinate of the user interactivity.

# Contribution

If you want to contribute to this project, please open a PR first. You can join r/placeWeekly to discuss and stay tuned about this project. 

# Conclusion
Please note that the project requires some clean up, if you want to use it now, you need to fix that yourself.

Thanks!

<script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="abrarFairuj" data-color="#FFDD00" data-emoji=""  data-font="Cookie" data-text="Buy me a coffee" data-outline-color="#000000" data-font-color="#000000" data-coffee-color="#ffffff" ></script>
