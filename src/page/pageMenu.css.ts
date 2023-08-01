import { Styles } from "@ijstech/components";

const Theme = Styles.Theme.ThemeVars;

export const menuBtnStyle = Styles.style({
    padding: 4,
    boxShadow: 'rgba(0, 0, 0, 0.1) 10px 10px 50px',
    background: '#fff',
    borderRadius: 10,
    $nest: {
        '.prevent-select': {
            userSelect: 'none'
        }
    }
})

export const menuCardStyle = Styles.style({
    cursor: 'grab',
    opacity: 1,
    transition: '0.3s',
    $nest: {
        '&.is-dragging': {
            opacity: 0.7
        },
        '&:hover': {
            backgroundColor: "#b8e4f2"
        },
        'i-label': {
            overflow: 'hidden',
            // whiteSpace: 'nowrap',
            // textOverflow: 'ellipsis',
            display: '-webkit-box',
            '-webkit-line-clamp': 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.25
        },
        '> i-image img': {
            width: 40,
            height: 40,
            objectFit: 'cover',
            borderRadius: 5
        }
    }
})

export const menuStyle = Styles.style({
    $nest: {
        '.active-drop-line': {
            background: 'rgb(66,133,244)',
            opacity: 1
        },
        '.inactive-drop-line': {
            background: 'rgb(0,0,0)',
            opacity: 0
        }
    }
})